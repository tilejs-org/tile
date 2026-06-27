import type {
  PrepareCollectionOptions,
  StorageAdapter,
} from "../types.js";

export interface MongoClientLike {
  db(name?: string): MongoDatabaseLike;
  connect?(): Promise<unknown>;
  close?(): Promise<unknown>;
}

export interface MongoDatabaseLike {
  collection(name: string): MongoCollectionLike;
}

export interface MongoCollectionLike {
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

export interface MongoAdapterConfig {
  dbName?: string;
  persistSchema?: boolean;
  schemaCollection?: string;
  manageClient?: boolean;
}

class MongoStorageAdapter implements StorageAdapter {
  private readonly client: MongoClientLike;
  private readonly db: MongoDatabaseLike;
  private readonly persistSchema: boolean;
  private readonly schemaCollection: string;
  private readonly manageClient: boolean;

  constructor(client: MongoClientLike, config: MongoAdapterConfig = {}) {
    this.client = client;
    this.db = client.db(config.dbName);
    this.persistSchema = config.persistSchema ?? true;
    this.schemaCollection = config.schemaCollection ?? "_tile_schemas";
    this.manageClient = config.manageClient ?? true;
  }

  private collection(name: string): MongoCollectionLike {
    return this.db.collection(name);
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
    if (!this.manageClient) {
      return;
    }

    await this.client.connect?.();
  }

  async disconnect(): Promise<void> {
    if (!this.manageClient) {
      return;
    }

    await this.client.close?.();
  }

  async flush(): Promise<void> {
    // No-op for MongoDB. Writes are handled by the driver.
  }
}

/**
 * Creates a MongoDB adapter without adding `mongodb` as an internal dependency.
 *
 * Any consumer-provided client implementing the expected shape is accepted,
 * including the official `MongoClient`.
 */
export function mongodbAdapter(
  client: MongoClientLike,
  config?: MongoAdapterConfig,
): StorageAdapter {
  return new MongoStorageAdapter(client, config);
}
