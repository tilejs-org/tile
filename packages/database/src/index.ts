/**
 * Public package entrypoint.
 *
 * @example
 * ```ts
 * import { Tile, Schema } from "@tilejs/database";
 * ```
 */
// export { Tile } from "./core/database.js";
export { Schema } from "./core/schema.js";
export { Model } from "./core/collection.js";
export type { Collection } from "./core/collection.js";
export { Database } from "./core/database.js";
export { Logger } from "./utils/logger.js";
export { BsonStorageEngine, FileSystem } from "./storage/filesystem.js";
export type { StorageEngine, BsonStorageConfig } from "./storage/filesystem.js";
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
  LoggerConfig,
  TileConfig,
  ValidatorFunction,
} from "./core/types.js";
