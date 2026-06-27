import test from "node:test";
import assert from "node:assert/strict";

import { mongodbAdapter } from "../dist/adapters/mongodb/index.js";
import { mongooseAdapter } from "../dist/adapters/mongoose/index.js";

function createMongoLikeEnvironment() {
  const state = {
    connected: 0,
    closed: 0,
    indexes: [],
    collections: new Map(),
  };

  const getCollectionStore = (name) => {
    let store = state.collections.get(name);
    if (!store) {
      store = new Map();
      state.collections.set(name, store);
    }
    return store;
  };

  const db = {
    collection(name) {
      return {
        async createIndex(spec, options) {
          state.indexes.push({ name, spec, options });
        },
        async findOne(filter) {
          const docs = getCollectionStore(name);
          if ("_id" in filter) {
            return docs.get(String(filter._id)) ?? null;
          }
          for (const doc of docs.values()) {
            let match = true;
            for (const [key, value] of Object.entries(filter)) {
              if (doc[key] !== value) {
                match = false;
                break;
              }
            }
            if (match) return doc;
          }
          return null;
        },
        find() {
          return {
            async toArray() {
              return Array.from(getCollectionStore(name).values());
            },
          };
        },
        async replaceOne(filter, replacement) {
          getCollectionStore(name).set(String(filter._id ?? replacement._id), replacement);
        },
        async deleteOne(filter) {
          getCollectionStore(name).delete(String(filter._id));
        },
      };
    },
  };

  const client = {
    db() {
      return db;
    },
    async connect() {
      state.connected += 1;
    },
    async close() {
      state.closed += 1;
    },
  };

  return { state, client };
}

function createMongooseLikeEnvironment() {
  const state = {
    connectCalls: 0,
    disconnectCalls: 0,
    closeCalls: 0,
    indexes: [],
    collections: new Map(),
    selectedDbNames: [],
  };

  const getCollectionStore = (name) => {
    let store = state.collections.get(name);
    if (!store) {
      store = new Map();
      state.collections.set(name, store);
    }
    return store;
  };

  const makeConnection = (dbName = "default") => ({
    collection(name) {
      return {
        async createIndex(spec, options) {
          state.indexes.push({ dbName, name, spec, options });
        },
        async findOne(filter) {
          const docs = getCollectionStore(`${dbName}:${name}`);
          if ("_id" in filter) {
            return docs.get(String(filter._id)) ?? null;
          }
          for (const doc of docs.values()) {
            let match = true;
            for (const [key, value] of Object.entries(filter)) {
              if (doc[key] !== value) {
                match = false;
                break;
              }
            }
            if (match) return doc;
          }
          return null;
        },
        find() {
          return {
            async toArray() {
              return Array.from(getCollectionStore(`${dbName}:${name}`).values());
            },
          };
        },
        async replaceOne(filter, replacement) {
          getCollectionStore(`${dbName}:${name}`).set(
            String(filter._id ?? replacement._id),
            replacement,
          );
        },
        async deleteOne(filter) {
          getCollectionStore(`${dbName}:${name}`).delete(String(filter._id));
        },
      };
    },
    useDb(name) {
      state.selectedDbNames.push(name);
      return makeConnection(name);
    },
    async asPromise() {
      state.connectCalls += 1;
    },
    async close() {
      state.closeCalls += 1;
    },
  });

  const mongoose = {
    connection: makeConnection(),
    async connect() {
      state.connectCalls += 1;
    },
    async disconnect() {
      state.disconnectCalls += 1;
    },
  };

  return { state, mongoose };
}

test("mongodbAdapter manages client lifecycle and skips manual _id index creation", async () => {
  const { state, client } = createMongoLikeEnvironment();
  const adapter = mongodbAdapter(client, { dbName: "app" });

  await adapter.connect?.();
  await adapter.prepareCollection("members", {
    uniqueFields: ["_id", "email"],
    schema: { fields: {}, timestamps: true },
  });
  await adapter.write("members", "1", { _id: "1", email: "a@b.com" });
  const found = await adapter.readByIndexedField?.("members", "email", "a@b.com");
  await adapter.disconnect?.();

  assert.equal(state.connected, 1);
  assert.equal(state.closed, 1);
  assert.deepEqual(state.indexes, [
    {
      name: "members",
      spec: { email: 1 },
      options: { unique: true },
    },
  ]);
  assert.equal(found?.email, "a@b.com");
});

test("mongooseAdapter manages connection lifecycle, selects dbName, and skips manual _id index creation", async () => {
  const { state, mongoose } = createMongooseLikeEnvironment();
  const adapter = mongooseAdapter(mongoose, {
    uri: "mongodb://127.0.0.1:27017",
    dbName: "app",
  });

  await adapter.connect?.();
  await adapter.prepareCollection("members", {
    uniqueFields: ["_id", "email"],
    schema: { fields: {}, timestamps: true },
  });
  await adapter.write("members", "1", { _id: "1", email: "a@b.com" });
  const found = await adapter.readByIndexedField?.("members", "email", "a@b.com");
  await adapter.disconnect?.();

  assert.equal(state.connectCalls, 1);
  assert.equal(state.disconnectCalls, 1);
  assert.ok(state.selectedDbNames.includes("app"));
  assert.deepEqual(state.indexes, [
    {
      dbName: "app",
      name: "members",
      spec: { email: 1 },
      options: { unique: true },
    },
  ]);
  assert.equal(found?.email, "a@b.com");
});
