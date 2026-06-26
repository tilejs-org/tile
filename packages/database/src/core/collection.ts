import { Schema } from "./schema.js";
import { BsonStorageEngine } from "../storage/filesystem.js";
import { Logger } from "../utils/logger.js";
import { Validator } from "../utils/validator.js";
import type {
  InternalDocumentFields,
  QueryFilter,
  UpdateData,
  UpdateOperators,
  PaginateOptions,
  PaginateResult,
  SchemaDescription,
} from "./types.js";
import { ObjectId } from "../storage/bson.js";

export interface Collection<T = any> {
  readonly schema: Schema<T>;
  describeSchema(): SchemaDescription;
  create(data: T): Promise<T & InternalDocumentFields>;
  findOne(
    filter: QueryFilter,
  ): Promise<(T & InternalDocumentFields) | null>;
  find(filter?: QueryFilter): Promise<Array<T & InternalDocumentFields>>;
  findOneByID(id: string): Promise<(T & InternalDocumentFields) | null>;
  findOneById(id: string): Promise<(T & InternalDocumentFields) | null>;
  updateOne(
    filter: QueryFilter,
    update: UpdateData | UpdateOperators,
  ): Promise<(T & InternalDocumentFields) | null>;
  upsert(
    filter: QueryFilter,
    data: UpdateData,
  ): Promise<T & InternalDocumentFields>;
  paginate(
    options?: PaginateOptions,
  ): Promise<PaginateResult<T & InternalDocumentFields>>;
  deleteOne(filter: QueryFilter): Promise<boolean>;
  deleteMany(filter?: QueryFilter): Promise<number>;
  countDocuments(filter?: QueryFilter): Promise<number>;
}

/**
 * Collection model with CRUD helpers.
 *
 * @example
 * ```ts
 * const Users = db.model("users", userSchema);
 * const user = await Users.create({ name: "Israel" });
 * ```
 */
export class Model<T = any> implements Collection<T> {
  /**
   * The schema bound to this model.
   *
   * @example
   * ```ts
   * console.log(Users.schema.describe());
   * ```
   */
  public readonly schema: Schema<T>;
  private storage: BsonStorageEngine;
  private logger: Logger;
  private name: string;
  private uniqueFields: Set<string> = new Set();
  private ready: Promise<void>;

  /**
   * Creates a model bound to one collection.
   */
  constructor(
    name: string,
    schema: Schema<T>,
    storage: BsonStorageEngine,
    logger: Logger,
  ) {
    this.name = name;
    this.schema = schema;
    this.storage = storage;
    this.logger = logger;
    this.identifyUniqueFields();
    this.ready = this.storage.prepareCollection(
      this.name,
      Array.from(this.uniqueFields),
    ).then(() => this.storage.writeCollectionSchema(this.name, this.schema.describe()));
  }

  private identifyUniqueFields(): void {
    const fields = this.schema.getFields();

    if (this.schema.hasInternalId()) {
      this.uniqueFields.add("_id");
    }

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      if (fieldDef.unique) {
        this.uniqueFields.add(fieldName);
      }
    }
  }

  private generateId(): string {
    return new ObjectId().toHexString();
  }

  private getDocumentVersion(data: any): number {
    const version = Number(data?.__v ?? 0);
    return Number.isNaN(version) ? 0 : version;
  }

  private normalizeReturnedDocument(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const result = { ...data };

    if (this.schema.hasVersionKey() && result.__v === undefined) {
      result.__v = 0;
    } else if (this.schema.hasVersionKey()) {
      result.__v = this.getDocumentVersion(result);
    }

    return result;
  }

  private applyDefaults(data: any): any {
    const fields = this.schema.getFields();
    const result = { ...data };

    if (result._id === undefined || result._id === null || result._id === "") {
      result._id = this.generateId();
    }

    if (this.schema.hasVersionKey()) {
      result.__v = 0;
    }

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      if (fieldName === "_id" || fieldName === "__v") {
        continue;
      }

      if (result[fieldName] === undefined) {
        if (fieldDef.auto) {
          result[fieldName] = this.generateId();
        } else if (fieldDef.default !== undefined) {
          result[fieldName] =
            typeof fieldDef.default === "function"
              ? fieldDef.default()
              : fieldDef.default;
        }
      }
    }

    return result;
  }

  private bumpVersionKey(doc: any): any {
    if (!this.schema.hasVersionKey()) {
      return doc;
    }

    return {
      ...doc,
      __v: this.getDocumentVersion(doc) + 1,
    };
  }

  private addTimestamps(data: any): any {
    if (this.schema.hasTimestamps()) {
      const now = new Date();
      data.createdAt = now;
      data.updatedAt = now;
    }
    return data;
  }

  private updateTimestamps(data: any): any {
    if (this.schema.hasTimestamps()) {
      data.updatedAt = new Date();
    }
    return data;
  }

  private validateDocument(data: any): void {
    const fields = this.schema.getFields();

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      const value = data[fieldName];
      Validator.validate(value, fieldDef, fieldName);
    }
  }

  private processDocument(data: any): any {
    const fields = this.schema.getFields();
    const result = { ...data };

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      if (result[fieldName] !== undefined) {
        result[fieldName] = Validator.processValue(
          result[fieldName],
          fieldDef,
          fieldName,
        );
      }
    }

    return result;
  }

  private getDeleteKeys(
    value: string[] | Record<string, boolean> | undefined,
  ): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key);
  }

  private applyUpdateOperations(
    doc: any,
    update: UpdateData | UpdateOperators,
  ): any {
    const nextDoc = { ...doc };

    for (const [key, value] of Object.entries(update)) {
      if (!key.startsWith("$")) {
        nextDoc[key] = value;
      }
    }

    if ("$set" in update && update.$set) {
      for (const [key, value] of Object.entries(update.$set)) {
        nextDoc[key] = value;
      }
    }

    if ("$inc" in update && update.$inc) {
      for (const [key, value] of Object.entries(update.$inc)) {
        const increment = Number(value);
        const current = nextDoc[key];
        const currentNumber =
          current === undefined || current === null ? 0 : Number(current);

        if (Number.isNaN(currentNumber)) {
          throw new Error(`Field "${key}" must be a number to use $inc`);
        }
        if (Number.isNaN(increment)) {
          throw new Error(`Field "${key}" must use a numeric $inc value`);
        }

        nextDoc[key] = currentNumber + increment;
      }
    }

    const deleteKeys = [
      ...this.getDeleteKeys(update.$delete),
      ...this.getDeleteKeys(update.$unset),
    ];

    for (const key of deleteKeys) {
      if (key === "_id") {
        continue;
      }

      delete nextDoc[key];
    }

    return nextDoc;
  }

  private async persistDocument(doc: any): Promise<void> {
    await this.storage.write(this.name, doc._id, doc);
    this.logger.debug(`Persisted document in "${this.name}" with id "${doc._id}"`);
  }

  /**
   * Returns a friendly schema summary for autocomplete and docs.
   *
   * @example
   * ```ts
   * console.log(Users.describeSchema());
   * ```
   */
  describeSchema(): SchemaDescription {
    return this.schema.describe();
  }

  /**
   * Inserts a new document.
   *
   * @example
   * ```ts
   * const user = await Users.create({ name: "Israel" });
   * ```
   */
  async create(data: T): Promise<T & InternalDocumentFields> {
    try {
      await this.ready;

      let doc = this.applyDefaults(data as any);
      doc = this.addTimestamps(doc);
      doc = this.processDocument(doc);
      this.validateDocument(doc);

      await this.persistDocument(doc);

      return this.normalizeReturnedDocument(doc) as T & InternalDocumentFields;
    } catch (error) {
      this.logger.error(`Error creating document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Finds the first document that matches a simple equality filter.
   *
   * @example
   * ```ts
   * const user = await Users.findOne({ name: "Israel" });
   * ```
   */
  async findOne(filter: QueryFilter): Promise<(T & InternalDocumentFields) | null> {
    try {
      await this.ready;

      const indexedEntry = this.getIndexedFilterEntry(filter);
      if (indexedEntry) {
        const [field, value] = indexedEntry;
        const doc = await this.storage.readByIndexedField(
          this.name,
          field,
          value,
        );

        if (doc && this.matchesFilter(doc, filter)) {
          return this.normalizeReturnedDocument(doc) as T & InternalDocumentFields;
        }
      }

      const allDocs = await this.storage.list(this.name);

      for (const doc of allDocs) {
        if (this.matchesFilter(doc, filter)) {
          return this.normalizeReturnedDocument(doc) as T & InternalDocumentFields;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error finding one document: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Finds all documents that match an optional filter.
   */
  async find(filter?: QueryFilter): Promise<Array<T & InternalDocumentFields>> {
    try {
      await this.ready;

      const allDocs = await this.storage.list(this.name);

      if (!filter || Object.keys(filter).length === 0) {
        return allDocs.map((doc) => this.normalizeReturnedDocument(doc)) as Array<
          T & InternalDocumentFields
        >;
      }

      return allDocs
        .filter((doc) => this.matchesFilter(doc, filter))
        .map((doc) => this.normalizeReturnedDocument(doc)) as Array<
          T & InternalDocumentFields
        >;
    } catch (error) {
      this.logger.error(`Error finding documents: ${(error as Error).message}`);
      throw error;
    }
  }

  private matchesFilter(doc: any, filter: QueryFilter): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (doc[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private getIndexedFilterEntry(
    filter: QueryFilter,
  ): [string, any] | null {
    for (const [key, value] of Object.entries(filter)) {
      if (this.uniqueFields.has(key)) {
        return [key, value];
      }
    }

    return null;
  }

  /**
   * Finds a document by its `_id`.
   *
   * @example
   * ```ts
   * const user = await Users.findOneByID(id);
   * ```
   */
  async findOneByID(id: string): Promise<(T & InternalDocumentFields) | null> {
    try {
      await this.ready;

      const doc = await this.storage.read(this.name, id);
      return doc
        ? (this.normalizeReturnedDocument(doc) as T & InternalDocumentFields)
        : null;
    } catch (error) {
      this.logger.error(
        `Error finding document by id: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Alias for `findOneByID`.
   */
  async findOneById(id: string): Promise<(T & InternalDocumentFields) | null> {
    return this.findOneByID(id);
  }

  /**
   * Updates the first matching document.
   *
   * Supports either a plain merge update or update operators.
   *
   * @example
   * ```ts
   * await Users.updateOne({ _id }, { $set: { name: "New" } });
   * ```
   */
  async updateOne(
    filter: QueryFilter,
    update: UpdateData | UpdateOperators,
  ): Promise<(T & InternalDocumentFields) | null> {
    try {
      await this.ready;

      const doc = await this.findOne(filter);
      if (!doc) {
        this.logger.debug(`No document found matching filter for update`);
        return null;
      }

      let updatedDoc = this.applyUpdateOperations(doc, update);
      updatedDoc = this.bumpVersionKey(updatedDoc);
      updatedDoc = this.updateTimestamps(updatedDoc);
      updatedDoc = this.processDocument(updatedDoc);
      this.validateDocument(updatedDoc);

      await this.persistDocument(updatedDoc);

      return this.normalizeReturnedDocument(updatedDoc) as T & InternalDocumentFields;
    } catch (error) {
      this.logger.error(`Error updating document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Updates the first match or creates a new document when none exists.
   */
  async upsert(
    filter: QueryFilter,
    data: UpdateData,
  ): Promise<T & InternalDocumentFields> {
    try {
      await this.ready;

      const existing = await this.findOne(filter);

      if (existing) {
        return (await this.updateOne(filter, data)) as T & InternalDocumentFields;
      } else {
        const newDoc = { ...filter, ...data };
        return await this.create(newDoc as any);
      }
    } catch (error) {
      this.logger.error(
        `Error upserting document: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Returns a paginated slice of the collection.
   */
  async paginate(
    options?: PaginateOptions,
  ): Promise<PaginateResult<T & InternalDocumentFields>> {
    try {
      await this.ready;

      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const sort = options?.sort;

      let allDocs = await this.storage.list(this.name);

      if (sort) {
        for (const [field, order] of Object.entries(sort)) {
          allDocs.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal < bVal) return order === "asc" ? -1 : 1;
            if (aVal > bVal) return order === "asc" ? 1 : -1;
            return 0;
          });
        }
      }

      const total = allDocs.length;
      const pages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;
      const items = allDocs.slice(skip, skip + limit);

      this.logger.debug(
        `Paginated "${this.name}" - page ${page}, limit ${limit}, total ${total}`,
      );

      return {
        items: items.map((item) => this.normalizeReturnedDocument(item)) as Array<
          T & InternalDocumentFields
        >,
        total,
        page,
        limit,
        pages,
      };
    } catch (error) {
      this.logger.error(
        `Error paginating documents: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes the first matching document.
   */
  async deleteOne(filter: QueryFilter): Promise<boolean> {
    try {
      await this.ready;

      const doc = await this.findOne(filter);
      if (!doc) {
        this.logger.debug(`No document found matching filter for deletion`);
        return false;
      }

      await this.storage.delete(this.name, (doc as any)._id);
      this.logger.debug(
        `Deleted document from "${this.name}" with id "${(doc as any)._id}"`,
      );

      return true;
    } catch (error) {
      this.logger.error(`Error deleting document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Deletes all documents that match an optional filter.
   */
  async deleteMany(filter?: QueryFilter): Promise<number> {
    try {
      await this.ready;

      const docs = await this.find(filter);
      let deleted = 0;

      for (const doc of docs) {
        await this.storage.delete(this.name, (doc as any)._id);
        deleted++;
      }

      this.logger.debug(`Deleted ${deleted} documents from "${this.name}"`);
      return deleted;
    } catch (error) {
      this.logger.error(
        `Error deleting documents: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Counts documents matching an optional filter.
   */
  async countDocuments(filter?: QueryFilter): Promise<number> {
    try {
      await this.ready;

      const docs = await this.find(filter);
      return docs.length;
    } catch (error) {
      this.logger.error(
        `Error counting documents: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
