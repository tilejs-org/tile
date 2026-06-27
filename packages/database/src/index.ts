/**
 * Public package entrypoint.
 *
 * @example
 * ```ts
 * import { Database, Schema } from "@tile.js/database";
 * ```
 */
export { Schema } from "./core/schema.js";
export { Model } from "./core/collection.js";
export type { Collection } from "./core/collection.js";
export { Database } from "./core/database.js";
export { Logger } from "./utils/logger.js";
export {
  defaultAdapter,
  DefaultStorageAdapter,
  BsonStorageEngine,
} from "./adapters/default/index.js";
export type {
  StorageEngine,
  DefaultStorageConfig,
  BsonStorageConfig,
} from "./adapters/default/index.js";
export type {
  PrepareCollectionOptions,
  StorageAdapter,
} from "./adapters/types.js";
export { Validator } from "./utils/validator.js";

export type {
  FieldType,
  FieldDefinition,
  SchemaDescription,
  SchemaFieldDescription,
  SchemaOptions,
  QueryFilter,
  UpdateData,
  PaginateOptions,
  PaginateResult,
  UpdateOperators,
  DatabaseConfig,
  LoggerConfig,
  TileConfig,
  ValidatorFunction,
} from "./core/types.js";
