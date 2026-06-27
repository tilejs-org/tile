import { Schema } from "./schema.js";
import { Model } from "./collection.js";
import type { Collection } from "./collection.js";
import { defaultAdapter } from "../adapters/default/index.js";
import {
  isStorageAdapter,
  type StorageAdapter,
} from "../adapters/types.js";
import { Logger } from "../utils/logger.js";
import type { TileConfig } from "./types.js";

/**
 * Main database facade.
 *
 * @example
 * ```ts
 * const db = new Database({
 *   dbName: "app",
 *   logger: { enabled: true },
 * });
 *
 * const Users = db.collection("users", userSchema);
 * ```
 */
export class Database {
  private config: {
    dbName?: string;
    storage: "workspace" | "global" | "adapter";
    compression: boolean;
    logger: {
      enabled: boolean;
      colors: boolean;
    };
  };

  private storage: StorageAdapter;
  private logger: Logger;
  private collections: Map<string, Collection<any>> = new Map();
  private connected = false;

  /**
   * Creates a database instance.
   *
   * @param config - Database settings.
   */
  constructor(config: TileConfig = {}) {
    const customAdapter = isStorageAdapter(config.storage)
      ? config.storage
      : undefined;
    const hasCustomAdapter = customAdapter !== undefined;

    if (hasCustomAdapter) {
      if (config.dbName !== undefined) {
        throw new Error(
          'Cannot use "dbName" when "storage" is a custom adapter. Configure the database name inside the adapter instead.',
        );
      }

      if (config.compression !== undefined) {
        throw new Error(
          'Cannot use "compression" when "storage" is a custom adapter. Configure compression inside the adapter instead.',
        );
      }
    }

    const defaultStorage = config.storage === "global" ? "global" : "workspace";
    const dbName = hasCustomAdapter ? undefined : config.dbName ?? "test";

    const logger = {
      enabled: config.logger?.enabled ?? false,
      colors: config.logger?.colors ?? false,
    };

    const compression = hasCustomAdapter ? false : config.compression ?? false;
    const storage = hasCustomAdapter ? "adapter" : defaultStorage;

    this.config = {
      dbName,
      storage,
      compression,
      logger,
    };

    if (customAdapter) {
      this.storage = customAdapter;
    } else {
      this.storage = defaultAdapter({
        dbName: dbName ?? "test",
        storage: defaultStorage,
        compression,
      });
    }

    this.logger = new Logger(logger);
  }

  private getConnectionLabel(): string {
    if (this.config.storage === "adapter") {
      return "adapter-backed database";
    }

    return `database "${this.config.dbName}"`;
  }

  /**
   * Opens the database connection flag and prepares logging.
   *
   * @example
   * ```ts
   * await db.connect();
   * ```
   */
  async connect(): Promise<void> {
    try {
      await this.storage.connect?.();
      this.connected = true;
      this.logger.info(`Connected to ${this.getConnectionLabel()}`);
    } catch (error) {
      this.logger.error(`Failed to connect: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Flushes pending writes and marks the database as disconnected.
   */
  async disconnect(): Promise<void> {
    try {
      await this.storage.flush?.();
      await this.storage.disconnect?.();
      this.connected = false;
      this.logger.info(`Disconnected from ${this.getConnectionLabel()}`);
    } catch (error) {
      this.logger.error(`Failed to disconnect: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Creates or returns a cached model for a collection.
   *
   * @example
   * ```ts
   * const Users = db.collection("users", userSchema);
   * ```
   */
  collection<T extends object = Record<string, unknown>>(
    name: string,
    schema: Schema<T>,
  ): Collection<T> {
    const existing = this.collections.get(name);

    if (existing) {
      return existing as Collection<T>;
    }

    const model = new Model<T>(name, schema, this.storage, this.logger);

    this.collections.set(name, model);
    this.logger.debug(`Collection "${name}" created`);

    return model;
  }

  /**
   * Alias for {@link collection}.
   */
  model<T extends object = Record<string, unknown>>(
    name: string,
    schema: Schema<T>,
  ): Collection<T> {
    return this.collection(name, schema);
  }

  /**
   * Returns a cached collection.
   */
  getCollection<T extends object = Record<string, unknown>>(
    name: string,
  ): Collection<T> | undefined {
    return this.collections.get(name) as Collection<T> | undefined;
  }

  /**
   * Alias for {@link getCollection}.
   */
  getModel<T extends object = Record<string, unknown>>(
    name: string,
  ): Collection<T> | undefined {
    return this.getCollection(name);
  }

  /**
   * Checks whether `connect()` has been called.
   */
  isConnected(): boolean {
    return this.connected;
  }
}
