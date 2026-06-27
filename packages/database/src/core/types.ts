import type { StorageAdapter } from "../adapters/types.js";

/**
 * Built-in field types supported by `Schema`.
 *
 * @example
 * ```ts
 * const userSchema = new Schema({
 *   name: String,
 *   age: Number,
 * });
 * ```
 */
export type FieldType =
  | "String"
  | "Number"
  | "Boolean"
  | "Date"
  | "Array"
  | "Object";

export type SchemaDefinition<T extends object> = {
  [K in keyof T]?:
    | FieldDefinition
    | FieldType
    | typeof String
    | typeof Number
    | typeof Boolean
    | typeof Date;
} & {
  _id?:
    | FieldDefinition
    | FieldType
    | typeof String
    | typeof Number
    | typeof Boolean
    | typeof Date;

  __v?:
    | FieldDefinition
    | FieldType
    | typeof String
    | typeof Number
    | typeof Boolean
    | typeof Date;
};

/**
 * Describes a field in a schema definition.
 *
 * @example
 * ```ts
 * const schema = new Schema({
 *   email: { type: String, required: true, unique: true },
 *   visits: { type: Number, default: 0 },
 * });
 * ```
 */
export interface FieldDefinition {
  type?:
    | FieldType
    | typeof String
    | typeof Number
    | typeof Boolean
    | typeof Date;
  required?: boolean;
  default?: any;
  unique?: boolean;
  lowercase?: boolean;
  trim?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  auto?: boolean;
  enum?: any[];
}

/**
 * Human-friendly field summary returned by schema/model introspection.
 */
export interface SchemaFieldDescription {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  auto: boolean;
  default: any;
  lowercase: boolean;
  trim: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: any[];
}

/**
 * Full schema summary for developer tooling and docs.
 */
export interface SchemaDescription {
  fields: Record<string, SchemaFieldDescription>;
  timestamps: boolean;
  collection?: string;
}

/**
 * Internal fields that can be present on every persisted document.
 */
export interface InternalDocumentFields {
  _id: string;
  __v: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Schema-level options.
 *
 * @example
 * ```ts
 * const schema = new Schema(fields, {
 *   _id: true,
 *   timestamps: true,
 *   versionKey: true,
 * });
 * ```
 */
export interface SchemaOptions {
  _id?: boolean;
  timestamps?: boolean;
  versionKey?: boolean;
  collection?: string;
}

/**
 * Simple equality filter used by `findOne`, `find`, `updateOne`, and deletes.
 *
 * @example
 * ```ts
 * await User.findOne({ email: "user@example.com" });
 * ```
 */
export interface QueryFilter {
  [key: string]: any;
}

/**
 * Plain update object. If you do not use operators, the values are merged.
 *
 * @example
 * ```ts
 * await User.updateOne({ _id }, { name: "New name" });
 * ```
 */
export interface UpdateData {
  [key: string]: any;
}

/**
 * Mongo-style update operators supported by `updateOne`.
 *
 * @example
 * ```ts
 * await User.updateOne(
 *   { _id },
 *   {
 *     $set: { verified: true },
 *     $inc: { visits: 1 },
 *     $delete: ["note"],
 *   }
 * );
 * ```
 */
export interface UpdateOperators {
  $set?: Record<string, any>;
  $inc?: Record<string, number>;
  $delete?: string[] | Record<string, boolean>;
  $unset?: string[] | Record<string, boolean>;
  [key: string]: any;
}

/**
 * Pagination options.
 *
 * @example
 * ```ts
 * const page = await User.paginate({ page: 1, limit: 10 });
 * ```
 */
export interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: {
    [key: string]: "asc" | "desc";
  };
}

/**
 * Pagination result payload.
 */
export interface PaginateResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Logger configuration.
 *
 * @example
 * ```ts
 * const db = new Database({ logger: { enabled: true, colors: true } });
 * ```
 */
export interface LoggerConfig {
  enabled?: boolean;
  colors?: boolean;
}

export interface BaseDatabaseConfig {
  /**
   * Define se aparece ou não os logs.
   *
   * @default enabled: false, colors: false
   */
  logger?: LoggerConfig;
}

/**
 * Configuration for the default adapter used by the library.
 */
export interface DefaultDatabaseConfig extends BaseDatabaseConfig {
  /**
   * Define o nome da database usada pelo adapter default da lib.
   *
   * @default "test"
   */
  dbName?: string;

  /**
   * Define onde os dados serão armazenados pelo adapter default.
   *
   * - "workspace": salva em `.tile/database/` na raiz do workspace/projeto.
   * - "global": salva em `~/.tile/database/`, tornando-os disponíveis globalmente para o usuário da máquina.
   *
   * Estrutura do adapter default:
   * - documentos: `.tile/database/<dbName>/<collection>/*.bson`
   * - metadados de schema: `.tile/database/<dbName>/<collection>/_schema.json`
   *
   * @default "workspace"
   */
  storage?: "workspace" | "global";

  /**
   * Habilita gzip no pipeline BSON do adapter default.
   *
   * @default false
   */
  compression?: boolean;
}

/**
 * Configuration for custom storage adapters.
 *
 * When `storage` is a custom adapter, persistence-specific fields such as
 * `dbName` and `compression` must be configured inside the adapter itself.
 */
export interface AdapterDatabaseConfig extends BaseDatabaseConfig {
  /**
   * Adapter customizado responsável por toda a persistência.
   */
  storage: StorageAdapter;
  dbName?: never;
  compression?: never;
}

/**
 * Database configuration.
 *
 * @example
 * ```ts
 * const db = new Database({
 *   dbName: "app",
 *   storage: "workspace",
 *   compression: false,
 * });
 * ```
 */
export type DatabaseConfig = DefaultDatabaseConfig | AdapterDatabaseConfig;

/**
 * Backwards-compatible alias kept for existing consumers.
 */
export type TileConfig = DatabaseConfig;

/**
 * Basic predicate used by validators.
 */
export type ValidatorFunction = (value: any) => boolean;
