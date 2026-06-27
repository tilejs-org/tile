import test from "node:test";
import assert from "node:assert/strict";

import {
  Database,
  Schema,
} from "../dist/index.js";

function createMemoryAdapter() {
  const collections = new Map();
  const calls = {
    prepareCollection: [],
    connect: 0,
    disconnect: 0,
    flush: 0,
    indexedReads: 0,
  };

  const getCollection = (name) => {
    let docs = collections.get(name);
    if (!docs) {
      docs = new Map();
      collections.set(name, docs);
    }
    return docs;
  };

  return {
    calls,
    adapter: {
      async prepareCollection(collection, options = {}) {
        calls.prepareCollection.push({ collection, options });
        getCollection(collection);
      },
      async write(collection, id, data) {
        getCollection(collection).set(String(id), structuredClone(data));
      },
      async read(collection, id) {
        return structuredClone(getCollection(collection).get(String(id)) ?? null);
      },
      async delete(collection, id) {
        getCollection(collection).delete(String(id));
      },
      async list(collection) {
        return Array.from(getCollection(collection).values()).map((doc) =>
          structuredClone(doc),
        );
      },
      async readByIndexedField(collection, field, value) {
        calls.indexedReads += 1;
        for (const doc of getCollection(collection).values()) {
          if (doc?.[field] === value) {
            return structuredClone(doc);
          }
        }
        return null;
      },
      async connect() {
        calls.connect += 1;
      },
      async disconnect() {
        calls.disconnect += 1;
      },
      async flush() {
        calls.flush += 1;
      },
    },
  };
}

test("Database rejects dbName when a custom adapter is used", () => {
  const { adapter } = createMemoryAdapter();

  assert.throws(
    () =>
      new Database({
        dbName: "should-fail",
        storage: adapter,
      }),
    /Cannot use "dbName" when "storage" is a custom adapter/,
  );
});

test("Database rejects compression when a custom adapter is used", () => {
  const { adapter } = createMemoryAdapter();

  assert.throws(
    () =>
      new Database({
        compression: true,
        storage: adapter,
      }),
    /Cannot use "compression" when "storage" is a custom adapter/,
  );
});

test("Database delegates connect and disconnect lifecycle to a custom adapter", async () => {
  const { adapter, calls } = createMemoryAdapter();
  const db = new Database({ storage: adapter });

  assert.equal(db.isConnected(), false);

  await db.connect();
  assert.equal(db.isConnected(), true);
  assert.equal(calls.connect, 1);

  await db.disconnect();
  assert.equal(db.isConnected(), false);
  assert.equal(calls.flush, 1);
  assert.equal(calls.disconnect, 1);
});

test("Model prepares schema metadata and preserves library semantics over custom adapters", async () => {
  const { adapter, calls } = createMemoryAdapter();
  const db = new Database({ storage: adapter });
  const schema = new Schema(
    {
      email: { type: String, unique: true, lowercase: true, trim: true },
      name: { type: String, trim: true },
      verified: { type: Boolean, default: false },
      visits: { type: Number, default: 0 },
      note: String,
    },
    { timestamps: true },
  );

  const users = db.collection("users", schema);

  assert.equal(calls.prepareCollection.length, 1);
  assert.equal(calls.prepareCollection[0].collection, "users");
  assert.deepEqual(
    new Set(calls.prepareCollection[0].options.uniqueFields),
    new Set(["_id", "email"]),
  );
  assert.equal(calls.prepareCollection[0].options.schema.timestamps, true);

  const created = await users.create({
    email: "  USER@EXAMPLE.COM  ",
    name: "  Israel  ",
    note: "hello",
  });

  assert.equal(created.email, "user@example.com");
  assert.equal(created.name, "Israel");
  assert.equal(created.verified, false);
  assert.equal(created.visits, 0);
  assert.equal(typeof created._id, "string");
  assert.equal(created.__v, 0);
  assert.ok(created.createdAt instanceof Date);
  assert.ok(created.updatedAt instanceof Date);

  const found = await users.findOne({ email: "user@example.com" });
  assert.equal(calls.indexedReads, 1);
  assert.equal(found?._id, created._id);

  const updated = await users.updateOne(
    { _id: created._id },
    {
      $set: { verified: true, name: "Israel Jatobá" },
      $inc: { visits: 2 },
      $delete: ["note"],
    },
  );

  assert.equal(updated?.verified, true);
  assert.equal(updated?.name, "Israel Jatobá");
  assert.equal(updated?.visits, 2);
  assert.equal(updated?.note, undefined);
  assert.equal(updated?.__v, 1);
  assert.ok(updated.updatedAt instanceof Date);

  const paginated = await users.paginate({ page: 1, limit: 10, sort: { visits: "desc" } });
  assert.equal(paginated.total, 1);
  assert.equal(paginated.items[0]._id, created._id);

  const count = await users.countDocuments({ verified: true });
  assert.equal(count, 1);

  const deleted = await users.deleteOne({ _id: created._id });
  assert.equal(deleted, true);
  assert.equal(await users.countDocuments(), 0);
});
