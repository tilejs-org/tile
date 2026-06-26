import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/**
 * Runtime-safe BSON bindings for Bun.
 *
 * This wrapper loads the official BSON bundle and exposes the pieces used by
 * the database without forcing Node-only startup paths.
 */
const require = createRequire(import.meta.url);
const bsonMainPath = require.resolve("bson");
const bsonBundlePath = join(dirname(bsonMainPath), "bson.bundle.js");

export let deserialize: typeof import("bson").deserialize;
export let ObjectId: typeof import("bson").ObjectId;
export let serialize: typeof import("bson").serialize;

const processLike = globalThis.process as
  | (NodeJS.Process & {
      getBuiltinModule?: (name: string) => unknown;
    })
  | undefined;

const originalGetBuiltinModule = processLike?.getBuiltinModule?.bind(processLike);

try {
  if (processLike) {
    processLike.getBuiltinModule = (name: string) => {
      if (name === "v8") {
        return {
          startupSnapshot: {
            isBuildingSnapshot: () => false,
          },
        };
      }

      return originalGetBuiltinModule?.(name);
    };
  }

  const source = await readFile(bsonBundlePath, "utf8");
  const bsonModule = Function(`${source}; return BSON;`)() as typeof import("bson");

  ({ deserialize, ObjectId, serialize } = bsonModule);
} finally {
  if (processLike) {
    if (originalGetBuiltinModule) {
      processLike.getBuiltinModule = originalGetBuiltinModule;
    } else {
      (processLike as any).getBuiltinModule = undefined;
    }
  }
}
