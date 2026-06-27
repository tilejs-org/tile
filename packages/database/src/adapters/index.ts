export {
  defaultAdapter,
  DefaultStorageAdapter,
  BsonStorageEngine,
} from "./default/index.js";
export { mongodbAdapter } from "./mongodb/index.js";
export { mongooseAdapter } from "./mongoose/index.js";

export type {
  StorageEngine,
  DefaultStorageConfig,
  BsonStorageConfig,
} from "./default/index.js";
export type { PrepareCollectionOptions, StorageAdapter } from "./types.js";
export type {
  MongoAdapterConfig,
  MongoClientLike,
  MongoCollectionLike,
  MongoDatabaseLike,
} from "./mongodb/index.js";
export type {
  MongooseAdapterConfig,
  MongooseConnectionLike,
  MongooseLike,
  MongooseNativeCollectionLike,
} from "./mongoose/index.js";
