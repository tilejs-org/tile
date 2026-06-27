import test from "node:test";
import assert from "node:assert/strict";

import { mongodbAdapter } from "../dist/adapters/mongodb/index.js";
import { mongooseAdapter } from "../dist/adapters/mongoose/index.js";

function createMongoLikeClient() {
  const state = { connect: 0, close: 0 };

  return {
    state,
    client: {
      db() {
        return {
          collection() {
            return {
              async createIndex() {},
              async findOne() { return null; },
              find() { return { async toArray() { return []; } }; },
              async replaceOne() {},
              async deleteOne() {},
            };
          },
        };
      },
      async connect() {
        state.connect += 1;
      },
      async close() {
        state.close += 1;
      },
    },
  };
}

function createMongooseLikeInstance() {
  const state = { connect: 0, disconnect: 0, asPromise: 0, close: 0 };
  const connection = {
    collection() {
      return {
        async createIndex() {},
        async findOne() { return null; },
        find() { return { async toArray() { return []; } }; },
        async replaceOne() {},
        async deleteOne() {},
      };
    },
    useDb() {
      return connection;
    },
    async asPromise() {
      state.asPromise += 1;
    },
    async close() {
      state.close += 1;
    },
  };

  return {
    state,
    mongoose: {
      connection,
      async connect() {
        state.connect += 1;
      },
      async disconnect() {
        state.disconnect += 1;
      },
    },
  };
}

test("mongodbAdapter does not manage client lifecycle when manageClient is false", async () => {
  const { client, state } = createMongoLikeClient();
  const adapter = mongodbAdapter(client, { manageClient: false, dbName: "app" });

  await adapter.connect?.();
  await adapter.disconnect?.();

  assert.equal(state.connect, 0);
  assert.equal(state.close, 0);
});

test("mongooseAdapter does not manage connection lifecycle when manageConnection is false", async () => {
  const { mongoose, state } = createMongooseLikeInstance();
  const adapter = mongooseAdapter(mongoose, {
    manageConnection: false,
    dbName: "app",
    uri: "mongodb://127.0.0.1:27017",
  });

  await adapter.connect?.();
  await adapter.disconnect?.();

  assert.equal(state.connect, 0);
  assert.equal(state.disconnect, 0);
  assert.equal(state.asPromise, 0);
  assert.equal(state.close, 0);
});
