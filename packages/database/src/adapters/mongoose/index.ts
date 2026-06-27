import type {
  PrepareCollectionOptions,
  StorageAdapter,
} from "../types.js";

export interface MongooseNativeCollectionLike {
  createIndex(
    indexSpec: Record<string, 1 | -1>,
    options?: { unique?: boolean },
  ): Promise<unknown>;
  findOne(filter: Record<string, any>): Promise<any | null>;
  find(filter?: Record<string, any>): {
    toArray(): Promise<any[]>;
  };
  replaceOne(
    filter: Record<string, any>,
    replacement: any,
    options?: { upsert?: boolean },
  ): Promise<unknown>;
  deleteOne(filter: Record<string, any>): Promise<unknown>;
}

export interface MongooseConnectionLike {
  collection(name: string): MongooseNativeCollectionLike;
  useDb?(
    name: string,
    options?: { useCache?: boolean },
  ): MongooseConnectionLike;
  asPromise?(): Promise<unknown>;
  openUri?(uri: string, options?: Record<string, any>): Promise<unknown>;
  close?(): Promise<unknown>;
  destroy?(): Promise<unknown>;
}

export interface MongooseLike {
  connection: MongooseConnectionLike;
  connect?(uri: string, options?: Record<string, any>): Promise<unknown>;
  disconnect?(): Promise<unknown>;
}

export interface MongooseAdapterConfig {
  dbName?: string;
  uri?: string;
  connectOptions?: Record<string, any>;
  persistSchema?: boolean;
  schemaCollection?: string;
  manageConnection?: boolean;
}

function isMongooseLike(value: unknown): value is MongooseLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      "connection" in value &&
      value.connection &&
      typeof (value as MongooseLike).connection.collection === "function",
  );
}

class MongooseStorageAdapter implements StorageAdapter {
  private readonly source: MongooseLike | MongooseConnectionLike;
  private readonly dbName?: string;
  private readonly uri?: string;
  private readonly connectOptions?: Record<string, any>;
  private readonly persistSchema: boolean;
  private readonly schemaCollection: string;
  private readonly manageConnection: boolean;

  constructor(
    source: MongooseLike | MongooseConnectionLike,
    config: MongooseAdapterConfig = {},
  ) {
    this.source = source;
    this.dbName = config.dbName;
    this.uri = config.uri;
    this.connectOptions = config.connectOptions;
    this.persistSchema = config.persistSchema ?? true;
    this.schemaCollection = config.schemaCollection ?? "_tile_schemas";
    this.manageConnection = config.manageConnection ?? true;
  }

  private getBaseConnection(): MongooseConnectionLike {
    return isMongooseLike(this.source) ? this.source.connection : this.source;
  }

  private getConnection(): MongooseConnectionLike {
    const connection = this.getBaseConnection();

    if (this.dbName && connection.useDb) {
      return connection.useDb(this.dbName, { useCache: true });
    }

    return connection;
  }

  private getConnectOptions(): Record<string, any> | undefined {
    if (!this.connectOptions && !this.dbName) {
      return undefined;
    }

    return {
      ...(this.connectOptions ?? {}),
      ...(this.dbName ? { dbName: this.dbName } : {}),
    };
  }

  private collection(name: string): MongooseNativeCollectionLike {
    return this.getConnection().collection(name);
  }

  async prepareCollection(
    collection: string,
    options: PrepareCollectionOptions = {},
  ): Promise<void> {
    const target = this.collection(collection);
    const uniqueFields = new Set(options.uniqueFields ?? []);

    for (const field of uniqueFields) {
      if (field === "_id") {
        continue;
      }

      await target.createIndex({ [field]: 1 }, { unique: true });
    }

    if (this.persistSchema && options.schema) {
      await this.collection(this.schemaCollection).replaceOne(
        { _id: collection },
        {
          _id: collection,
          collection,
          schema: options.schema,
          updatedAt: new Date(),
        },
        { upsert: true },
      );
    }
  }

  async write(collection: string, id: string, data: any): Promise<void> {
    await this.collection(collection).replaceOne({ _id: id }, data, {
      upsert: true,
    });
  }

  async read(collection: string, id: string): Promise<any | null> {
    return this.collection(collection).findOne({ _id: id });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.collection(collection).deleteOne({ _id: id });
  }

  async list(collection: string): Promise<any[]> {
    return this.collection(collection).find({}).toArray();
  }

  async readByIndexedField(
    collection: string,
    field: string,
    value: any,
  ): Promise<any | null> {
    if (field === "_id") {
      return this.read(collection, String(value));
    }

    return this.collection(collection).findOne({ [field]: value });
  }

  async connect(): Promise<void> {
    if (!this.manageConnection) {
      return;
    }

    const options = this.getConnectOptions();

    if (isMongooseLike(this.source)) {
      if (this.uri && this.source.connect) {
        await this.source.connect(this.uri, options);
        return;
      }

      await this.source.connection.asPromise?.();
      return;
    }

    if (this.uri && this.source.openUri) {
      await this.source.openUri(this.uri, options);
      return;
    }

    await this.source.asPromise?.();
  }

  async disconnect(): Promise<void> {
    if (!this.manageConnection) {
      return;
    }

    if (isMongooseLike(this.source)) {
      await this.source.disconnect?.();
      return;
    }

    if (this.source.close) {
      await this.source.close();
      return;
    }

    await this.source.destroy?.();
  }

  async flush(): Promise<void> {
    // No-op for Mongoose. Writes are handled by the driver.
  }
}

/**
 * Creates a Mongoose adapter without adding `mongoose` as an internal dependency.
 *
 * Any consumer-provided Mongoose instance or connection implementing the
 * expected shape is accepted.
 */
export function mongooseAdapter(
  source: MongooseLike | MongooseConnectionLike,
  config?: MongooseAdapterConfig,
): StorageAdapter {
  return new MongooseStorageAdapter(source, config);
}
