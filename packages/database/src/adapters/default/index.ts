import {
  deserialize,
  // ObjectId,
  serialize
} from "./bson.js";
import { gunzipSync, gzipSync } from "node:zlib";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { homedir } from "node:os";
import type {
  PrepareCollectionOptions,
  StorageAdapter,
} from "../types.js";
import type { SchemaDescription } from "../../core/types.js";

/**
 * Minimal contract for a storage backend.
 *
 * @example
 * ```ts
 * const storage: StorageEngine = new DefaultStorageAdapter({ dbName: "app" });
 * ```
 */
export interface StorageEngine {
  write(collection: string, id: string, data: any): Promise<void>;
  read(collection: string, id: string): Promise<any>;
  delete(collection: string, id: string): Promise<void>;
}

/**
 * Configuration for the default local adapter.
 */
export interface DefaultStorageConfig {
  dbName: string;
  storage?: "workspace" | "global";
  compression?: boolean;
}

type PendingOperation =
  | {
      type: "write";
      collection: string;
      id: string;
      data: any;
    }
  | {
      type: "delete";
      collection: string;
      id: string;
    };

type CollectionState = {
  initialized: boolean;
  initializing?: Promise<void>;
  uniqueFields: Set<string>;
  indexCache: Map<string, Map<string, string>>;
  dirtyIndexes: Set<string>;
};

/**
 * BSON-backed storage engine with batched writes and simple indexes.
 *
 * @example
 * ```ts
 * const storage = new DefaultStorageAdapter({ dbName: "app" });
 * await storage.write("users", id, data);
 * ```
 */
export class DefaultStorageAdapter implements StorageEngine, StorageAdapter {
  private readonly dbName: string;
  private readonly rootPath: string;
  private readonly legacyRootPath: string;
  private readonly compression: boolean;

  private readonly pendingOperations = new Map<string, PendingOperation>();
  private readonly collections = new Map<string, CollectionState>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushPromise: Promise<void> | null = null;

  private static instances = new Set<DefaultStorageAdapter>();
  private static hooksRegistered = false;

  /**
   * Creates a storage engine rooted at `.tile/database/<dbName>`.
   * Collection data and schema metadata stay under `<collection>/`.
   */
  constructor(config: DefaultStorageConfig) {
    this.dbName = config.dbName;
    this.compression = config.compression ?? false;

    const basePath =
      config.storage === "global"
        ? join(homedir(), ".tile")
        : join(process.cwd(), ".tile");
    this.rootPath = join(basePath, "database", this.dbName);
    this.legacyRootPath = join(basePath, this.dbName);
    this.registerInstance();
  }

  private registerInstance(): void {
    DefaultStorageAdapter.instances.add(this);
    DefaultStorageAdapter.registerShutdownHooks();
  }

  private static registerShutdownHooks(): void {
    if (DefaultStorageAdapter.hooksRegistered) {
      return;
    }

    DefaultStorageAdapter.hooksRegistered = true;

    const flushAll = async (): Promise<void> => {
      await Promise.all(
        Array.from(DefaultStorageAdapter.instances).map((instance) =>
          instance.flush(),
        ),
      );
    };

    process.once("beforeExit", () => {
      void flushAll();
    });

    process.once("SIGINT", () => {
      void flushAll().finally(() => process.exit(0));
    });

    process.once("SIGTERM", () => {
      void flushAll().finally(() => process.exit(0));
    });
  }

  /**
   * Returns the root directory used by the database.
   */
  getDbPath(): string {
    return this.rootPath;
  }

  private getLegacyCollectionPath(collection: string): string {
    return join(this.legacyRootPath, collection);
  }

  /**
   * Returns the on-disk path for one collection.
   */
  getCollectionPath(collection: string): string {
    return join(this.rootPath, collection);
  }

  /**
   * Returns the BSON file path for a document id.
   */
  getDocumentPath(collection: string, id: string): string {
    return join(this.getCollectionPath(collection), `${id}.bson`);
  }

  getLegacyDocumentPath(collection: string, id: string): string {
    return join(this.getLegacyCollectionPath(collection), `${id}.json`);
  }

  getSchemaMetadataPath(collection: string): string {
    return join(this.getCollectionPath(collection), `_schema.json`);
  }

  private getLegacySchemaMetadataPath(collection: string): string {
    return join(
      this.getLegacyCollectionPath(collection),
      `_collection_index_schema.json`,
    );
  }

  private getIndexPath(collection: string, field: string): string {
    const safeField = field.replace(/^_+/, "") || field;
    return join(
      this.getCollectionPath(collection),
      `_collection_index_${safeField}.json`,
    );
  }

  private getLegacyIndexPath(collection: string, field: string): string {
    return join(
      this.getLegacyCollectionPath(collection),
      `_collection_index_${field}.json`,
    );
  }

  private getOperationKey(collection: string, id: string): string {
    return `${collection}:${id}`;
  }

  private getOrCreateCollectionState(
    collection: string,
    uniqueFields: string[] = [],
  ): CollectionState {
    let state = this.collections.get(collection);

    if (!state) {
      state = {
        initialized: false,
        uniqueFields: new Set(uniqueFields),
        indexCache: new Map(),
        dirtyIndexes: new Set(),
      };
      this.collections.set(collection, state);
      return state;
    }

    for (const field of uniqueFields) {
      state.uniqueFields.add(field);
    }

    return state;
  }

  /**
   * Prepares a collection and loads any known indexes.
   */
  async prepareCollection(
    collection: string,
    options: PrepareCollectionOptions = {},
  ): Promise<void> {
    const uniqueFields = options.uniqueFields ?? [];
    const state = this.getOrCreateCollectionState(collection, uniqueFields);

    if (!state.initialized) {
      if (!state.initializing) {
        state.initializing = this.initializeCollection(collection, state).then(
          () => {
            state.initialized = true;
          },
        );
      }

      await state.initializing;
      state.initializing = undefined;
    } else {
      for (const field of uniqueFields) {
        await this.ensureIndexForField(collection, state, field);
      }
    }

    if (options.schema) {
      await this.writeCollectionSchema(collection, options.schema);
    }
  }

  private async initializeCollection(
    collection: string,
    state: CollectionState,
  ): Promise<void> {
    await mkdir(this.getCollectionPath(collection), { recursive: true });

    await this.migrateLegacyDocuments(collection);
    await this.migrateLegacyCollection(collection);
    await this.cleanupSchemaArtifacts(collection);

    for (const field of state.uniqueFields) {
      await this.ensureIndexForField(collection, state, field);
    }
  }

  private async migrateLegacyCollection(collection: string): Promise<void> {
    const legacyCollectionPath = this.getLegacyCollectionPath(collection);

    if (!existsSync(legacyCollectionPath)) {
      return;
    }

    await mkdir(this.getCollectionPath(collection), { recursive: true });

    const entries = await readdir(legacyCollectionPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const legacyPath = join(legacyCollectionPath, entry.name);
      const newPath = join(this.getCollectionPath(collection), entry.name);

      if (existsSync(newPath)) {
        continue;
      }

      try {
        await rename(legacyPath, newPath);
      } catch {
        // Keep best-effort compatibility with legacy files.
      }
    }
  }

  private async ensureIndexForField(
    collection: string,
    state: CollectionState,
    field: string,
  ): Promise<void> {
    if (state.indexCache.has(field)) {
      return;
    }

    const indexPath = this.getIndexPath(collection, field);
    const legacyIndexPath = this.getLegacyIndexPath(collection, field);

    if (existsSync(indexPath)) {
      try {
        const raw = await readFile(indexPath, "utf8");
        const parsed = JSON.parse(raw) as Record<string, string>;
        state.indexCache.set(
          field,
          new Map(
            Object.entries(parsed).map(([key, value]) => [
              key,
              typeof value === "string" ? value : key,
            ]),
          ),
        );
        return;
      } catch {
        // Fall through and rebuild the index from disk.
      }
    }

    if (existsSync(legacyIndexPath)) {
      try {
        const raw = await readFile(legacyIndexPath, "utf8");
        const parsed = JSON.parse(raw) as Record<string, string | boolean>;
        const legacyIndex = new Map(
          Object.entries(parsed).map(([key, value]) => [
            key,
            typeof value === "string" ? value : key,
          ]),
        );

        state.indexCache.set(field, legacyIndex);
        state.dirtyIndexes.add(field);
        await this.persistIndex(collection, field, legacyIndex);
        state.dirtyIndexes.delete(field);
        await unlink(legacyIndexPath);
        return;
      } catch {
        // Fall through and rebuild the index from disk.
      }
    }

    const index = await this.rebuildIndex(collection, field);
    state.indexCache.set(field, index);
    state.dirtyIndexes.add(field);
    await this.persistIndex(collection, field, index);
    state.dirtyIndexes.delete(field);
  }

  /**
   * Persists a schema summary alongside the collection data.
   *
   * @example
   * ```ts
   * await storage.writeCollectionSchema("users", schema.describe());
   * ```
   */
  async writeCollectionSchema(
    collection: string,
    schema: SchemaDescription,
  ): Promise<void> {
    await mkdir(this.getCollectionPath(collection), { recursive: true });

    const payload = JSON.stringify(schema, null, 2);
    const targetPath = this.getSchemaMetadataPath(collection);
    const tempPath = `${targetPath}.tmp`;

    await writeFile(tempPath, payload, "utf8");
    await rename(tempPath, targetPath);

    const legacyPath = this.getLegacySchemaMetadataPath(collection);
    if (existsSync(legacyPath)) {
      try {
        await unlink(legacyPath);
      } catch {
        // Keep legacy schema metadata if cleanup fails.
      }
    }
  }

  private async migrateLegacyDocuments(collection: string): Promise<void> {
    const collectionPath = this.getLegacyCollectionPath(collection);
    if (!existsSync(collectionPath)) {
      return;
    }

    const entries = await readdir(collectionPath, { withFileTypes: true });
    const legacyFiles = entries.filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".json") &&
        !entry.name.startsWith("_collection_index_") &&
        entry.name !== "_schema.json",
    );

    if (legacyFiles.length === 0) {
      return;
    }

    for (const entry of legacyFiles) {
      const legacyPath = join(collectionPath, entry.name);
      const idFromFile = entry.name.slice(0, -".json".length);

      try {
        const raw = await readFile(legacyPath, "utf8");
        const parsed = JSON.parse(raw) as Record<string, any>;
        const documentId =
          typeof parsed._id === "string" && parsed._id.length > 0
            ? parsed._id
            : idFromFile;
        const document = {
          ...parsed,
          _id: documentId,
        };

        await this.writeBinaryDocument(this.getDocumentPath(collection, documentId), document);
        await unlink(legacyPath);
      } catch {
        // Keep the legacy file in place if the migration fails.
      }
    }
  }

  private async cleanupSchemaArtifacts(collection: string): Promise<void> {
    const schemaArtifactPath = join(
      this.getCollectionPath(collection),
      "_schema.bson",
    );

    if (existsSync(schemaArtifactPath)) {
      try {
        await unlink(schemaArtifactPath);
      } catch {
        // Keep best-effort cleanup for old schema artifacts.
      }
    }
  }

  private async rebuildIndex(
    collection: string,
    field: string,
  ): Promise<Map<string, string>> {
    const docs = await this.listCommittedDocuments(collection);
    const index = new Map<string, string>();

    for (const doc of docs) {
      const value = doc?.[field];
      const id = doc?._id;

      if (value === undefined || value === null || typeof id !== "string") {
        continue;
      }

      const key = String(value);
      if (!index.has(key)) {
        index.set(key, id);
      }
    }

    return index;
  }

  private async persistIndex(
    collection: string,
    field: string,
    index: Map<string, string>,
  ): Promise<void> {
    await mkdir(this.getCollectionPath(collection), { recursive: true });

    const payloadObject =
      field === "_id"
        ? Object.fromEntries(Array.from(index.keys()).map((key) => [key, true]))
        : Object.fromEntries(index);
    const payload = JSON.stringify(payloadObject, null, 2);
    const targetPath = this.getIndexPath(collection, field);
    const tempPath = `${targetPath}.tmp`;

    await writeFile(tempPath, payload, "utf8");
    await rename(tempPath, targetPath);
  }

  private encodeDocument(data: any): Buffer {
    const serialized = serialize(data);
    return this.compression ? gzipSync(serialized) : Buffer.from(serialized);
  }

  private decodeDocument(buffer: Buffer): any {
    const raw = this.isGzipBuffer(buffer) ? gunzipSync(buffer) : buffer;
    return deserialize(raw);
  }

  private isGzipBuffer(buffer: Buffer): boolean {
    return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  }

  private async readBinaryDocument(filePath: string): Promise<any | null> {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const buffer = Buffer.from(await readFile(filePath));
      return this.decodeDocument(buffer);
    } catch {
      return null;
    }
  }

  private async writeBinaryDocument(filePath: string, data: any): Promise<void> {
    await mkdir(this.getCollectionPath(this.getCollectionFromPath(filePath)), {
      recursive: true,
    });

    const buffer = this.encodeDocument(data);
    const tempPath = `${filePath}.tmp`;

    await writeFile(tempPath, buffer);
    await rename(tempPath, filePath);
  }

  private getCollectionFromPath(filePath: string): string {
    const relativePath = relative(this.rootPath, filePath);
    const [collection] = relativePath.split(/[\\/]/);
    return collection;
  }

  private async deleteBinaryDocument(filePath: string): Promise<void> {
    if (!existsSync(filePath)) {
      return;
    }

    await unlink(filePath);
  }

  private async readCommittedDocument(
    collection: string,
    id: string,
  ): Promise<any | null> {
    const bsonPath = this.getDocumentPath(collection, id);
    const bsonDocument = await this.readBinaryDocument(bsonPath);

    if (bsonDocument !== null) {
      return bsonDocument;
    }

    const candidateJsonPaths = [
      join(this.getCollectionPath(collection), `${id}.json`),
      this.getLegacyDocumentPath(collection, id),
    ];

    for (const candidatePath of candidateJsonPaths) {
      if (!existsSync(candidatePath)) {
        continue;
      }

      try {
        const raw = await readFile(candidatePath, "utf8");
        return JSON.parse(raw);
      } catch {
        // Try the next candidate path.
      }
    }

    return null;
  }

  private async listCommittedDocuments(collection: string): Promise<any[]> {
    const collectionPath = this.getCollectionPath(collection);
    if (!existsSync(collectionPath)) {
      return [];
    }

    const docs = new Map<string, any>();
    const entries = await readdir(collectionPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      if (entry.name.endsWith(".bson")) {
        const document = await this.readBinaryDocument(join(collectionPath, entry.name));
        if (document && typeof document._id === "string") {
          docs.set(document._id, document);
        }
      }
    }

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      if (
        entry.name.endsWith(".json") &&
        !entry.name.startsWith("_collection_index_")
      ) {
        const id = entry.name.slice(0, -".json".length);
        if (docs.has(id)) {
          continue;
        }

        const legacyDocument = await this.readCommittedDocument(collection, id);
        if (legacyDocument && typeof legacyDocument._id === "string") {
          docs.set(legacyDocument._id, legacyDocument);
        }
      }
    }

    return Array.from(docs.values());
  }

  private async getCurrentDocumentForWrite(
    collection: string,
    id: string,
  ): Promise<any | null> {
    const pending = this.pendingOperations.get(this.getOperationKey(collection, id));

    if (pending?.type === "write") {
      return pending.data;
    }

    return this.readCommittedDocument(collection, id);
  }

  private async getCurrentDocumentForDelete(
    collection: string,
    id: string,
  ): Promise<any | null> {
    const pending = this.pendingOperations.get(this.getOperationKey(collection, id));

    if (pending?.type === "write") {
      return pending.data;
    }

    return this.readCommittedDocument(collection, id);
  }

  private getCollectionStateOrThrow(collection: string): CollectionState {
    const state = this.collections.get(collection);

    if (!state) {
      throw new Error(`Collection "${collection}" is not initialized`);
    }

    return state;
  }

  private async updateIndexStateForWrite(
    collection: string,
    previousDocument: any | null,
    nextDocument: any,
  ): Promise<void> {
    const state = this.getCollectionStateOrThrow(collection);

    for (const field of state.uniqueFields) {
      const nextValue = nextDocument?.[field];
      if (nextValue === undefined || nextValue === null) {
        continue;
      }

      const nextKey = String(nextValue);
      const currentIndex = state.indexCache.get(field);
      const currentOwner = currentIndex?.get(nextKey);

      if (currentOwner && currentOwner !== nextDocument._id) {
        throw new Error(
          `Field "${field}" with value "${nextValue}" already exists`,
        );
      }
    }

    if (previousDocument && typeof previousDocument._id === "string") {
      for (const field of state.uniqueFields) {
        const previousValue = previousDocument[field];
        if (previousValue === undefined || previousValue === null) {
          continue;
        }

        const previousKey = String(previousValue);
        const currentIndex = state.indexCache.get(field);
        if (currentIndex?.get(previousKey) === previousDocument._id) {
          currentIndex?.delete(previousKey);
          state.dirtyIndexes.add(field);
        }
      }
    }

    for (const field of state.uniqueFields) {
      const nextValue = nextDocument[field];
      if (nextValue === undefined || nextValue === null) {
        continue;
      }

      const nextKey = String(nextValue);
      let currentIndex = state.indexCache.get(field);

      if (!currentIndex) {
        currentIndex = new Map<string, string>();
        state.indexCache.set(field, currentIndex);
      }

      currentIndex.set(nextKey, nextDocument._id);
      state.dirtyIndexes.add(field);
    }
  }

  private async updateIndexStateForDelete(
    collection: string,
    previousDocument: any | null,
  ): Promise<void> {
    if (!previousDocument || typeof previousDocument._id !== "string") {
      return;
    }

    const state = this.getCollectionStateOrThrow(collection);

    for (const field of state.uniqueFields) {
      const previousValue = previousDocument[field];
      if (previousValue === undefined || previousValue === null) {
        continue;
      }

      const previousKey = String(previousValue);
      const currentIndex = state.indexCache.get(field);
      if (currentIndex?.get(previousKey) === previousDocument._id) {
        currentIndex?.delete(previousKey);
        state.dirtyIndexes.add(field);
      }
    }
  }

  private queueOperation(operation: PendingOperation): void {
    const key = this.getOperationKey(operation.collection, operation.id);
    this.pendingOperations.set(key, operation);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, 50);
  }

  /**
   * Forces all pending writes and dirty indexes to be flushed.
   */
  async flush(): Promise<void> {
    if (this.flushPromise) {
      return this.flushPromise;
    }

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    this.flushPromise = this.performFlush().finally(() => {
      this.flushPromise = null;
    });

    return this.flushPromise;
  }

  private async performFlush(): Promise<void> {
    while (this.pendingOperations.size > 0) {
      const operations = Array.from(this.pendingOperations.values());
      this.pendingOperations.clear();

      for (const operation of operations) {
        if (operation.type === "write") {
          await this.writeBinaryDocument(
            this.getDocumentPath(operation.collection, operation.id),
            operation.data,
          );
        } else {
          await this.deleteBinaryDocument(
            this.getDocumentPath(operation.collection, operation.id),
          );
        }
      }
    }

    for (const [collection, state] of this.collections) {
      for (const field of state.dirtyIndexes) {
        const index = state.indexCache.get(field);
        if (index) {
          await this.persistIndex(collection, field, index);
        }
      }
      state.dirtyIndexes.clear();
    }
  }

  /**
   * Queues a document write.
   */
  async write(collection: string, id: string, data: any): Promise<void> {
    await this.prepareCollection(collection);

    const previous = await this.getCurrentDocumentForWrite(collection, id);
    await this.updateIndexStateForWrite(collection, previous, data);

    this.queueOperation({
      type: "write",
      collection,
      id,
      data,
    });
  }

  /**
   * Reads one document by id.
   */
  async read(collection: string, id: string): Promise<any> {
    await this.prepareCollection(collection);

    const pending = this.pendingOperations.get(this.getOperationKey(collection, id));
    if (pending?.type === "write") {
      return pending.data;
    }

    if (pending?.type === "delete") {
      return null;
    }

    return this.readCommittedDocument(collection, id);
  }

  /**
   * Queues a document delete.
   */
  async delete(collection: string, id: string): Promise<void> {
    await this.prepareCollection(collection);

    const previous = await this.getCurrentDocumentForDelete(collection, id);
    await this.updateIndexStateForDelete(collection, previous);

    this.queueOperation({
      type: "delete",
      collection,
      id,
    });
  }

  /**
   * Lists all committed and pending documents for one collection.
   */
  async list(collection: string): Promise<any[]> {
    await this.prepareCollection(collection);

    const docs = new Map<string, any>();
    const committedDocuments = await this.listCommittedDocuments(collection);

    for (const document of committedDocuments) {
      if (document && typeof document._id === "string") {
        docs.set(document._id, document);
      }
    }

    for (const operation of this.pendingOperations.values()) {
      if (operation.collection !== collection) {
        continue;
      }

      if (operation.type === "write") {
        docs.set(operation.id, operation.data);
      } else {
        docs.delete(operation.id);
      }
    }

    return Array.from(docs.values());
  }

  /**
   * Reads the first document matching an indexed field.
   */
  async readByIndexedField(
    collection: string,
    field: string,
    value: any,
  ): Promise<any | null> {
    await this.prepareCollection(collection);

    if (field === "_id") {
      return this.read(collection, String(value));
    }

    const state = this.getCollectionStateOrThrow(collection);
    const index = state.indexCache.get(field);
    if (!index) {
      return null;
    }

    const id = index.get(String(value));
    if (!id) {
      return null;
    }

    return this.read(collection, id);
  }
}

/**
 * Creates the default local adapter used by `@tile.js/database`.
 */
export function defaultAdapter(
  config: DefaultStorageConfig,
): DefaultStorageAdapter {
  return new DefaultStorageAdapter(config);
}

/**
 * Backwards-compatible type alias for older BSON-focused naming.
 */
export type BsonStorageConfig = DefaultStorageConfig;

/**
 * Backwards-compatible alias for the previous storage engine name.
 */
export class BsonStorageEngine extends DefaultStorageAdapter {}
