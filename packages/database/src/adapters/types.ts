import type { SchemaDescription } from "../core/types.js";

/**
 * Collection metadata made available to storage adapters.
 */
export interface PrepareCollectionOptions {
  uniqueFields?: string[];
  schema?: SchemaDescription;
}

/**
 * Full storage contract required by the database runtime.
 *
 * Adapters can persist data anywhere as long as they implement these methods.
 */
export interface StorageAdapter {
  prepareCollection(
    collection: string,
    options?: PrepareCollectionOptions,
  ): Promise<void>;
  write(collection: string, id: string, data: any): Promise<void>;
  read(collection: string, id: string): Promise<any | null>;
  delete(collection: string, id: string): Promise<void>;
  list(collection: string): Promise<any[]>;
  readByIndexedField?(
    collection: string,
    field: string,
    value: any,
  ): Promise<any | null>;
  flush?(): Promise<void>;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
}

/**
 * Runtime guard used to detect custom adapters passed to `Database`.
 */
export function isStorageAdapter(value: unknown): value is StorageAdapter {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StorageAdapter>;

  return (
    typeof candidate.prepareCollection === "function" &&
    typeof candidate.write === "function" &&
    typeof candidate.read === "function" &&
    typeof candidate.delete === "function" &&
    typeof candidate.list === "function"
  );
}
