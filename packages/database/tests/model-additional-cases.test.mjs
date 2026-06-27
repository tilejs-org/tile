import test from "node:test";
import assert from "node:assert/strict";

import { Database, Schema } from "../dist/index.js";

function createMemoryAdapter({ withIndexedReads = true } = {}) {
  const collections = new Map();
  const collectionMeta = new Map();
  const calls = {
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

  const getCollectionMeta = (name) => {
    let meta = collectionMeta.get(name);
    if (!meta) {
      meta = { uniqueFields: new Set() };
      collectionMeta.set(name, meta);
    }
    return meta;
  };

  const adapter = {
    async prepareCollection(collection, options = {}) {
      getCollection(collection);
      const meta = getCollectionMeta(collection);
      for (const field of options.uniqueFields ?? []) {
        meta.uniqueFields.add(field);
      }
    },
    async write(collection, id, data) {
      const docs = getCollection(collection);
      const meta = getCollectionMeta(collection);

      for (const field of meta.uniqueFields) {
        const nextValue = data?.[field];
        if (nextValue === undefined || nextValue === null) {
          continue;
        }

        for (const [existingId, existingDoc] of docs.entries()) {
          if (existingId === String(id)) {
            continue;
          }

          if (existingDoc?.[field] === nextValue) {
            throw new Error(`Field "${field}" with value "${nextValue}" already exists`);
          }
        }
      }

      docs.set(String(id), structuredClone(data));
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
    async connect() {
      calls.connect += 1;
    },
    async disconnect() {
      calls.disconnect += 1;
    },
    async flush() {
      calls.flush += 1;
    },
  };

  if (withIndexedReads) {
    adapter.readByIndexedField = async (collection, field, value) => {
      calls.indexedReads += 1;
      for (const doc of getCollection(collection).values()) {
        if (doc?.[field] === value) {
          return structuredClone(doc);
        }
      }
      return null;
    };
  }

  return { adapter, calls };
}

test("upsert creates when missing and updates when a document already exists", async () => {
  const { adapter } = createMemoryAdapter();
  const db = new Database({ storage: adapter });
  const schema = new Schema({
    email: { type: String, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    visits: { type: Number, default: 0 },
  });
  const users = db.collection("users", schema);

  const created = await users.upsert(
    { email: "USER@example.com" },
    { name: "Israel", visits: 1 },
  );

  assert.equal(created.email, "user@example.com");
  assert.equal(created.name, "Israel");
  assert.equal(created.visits, 1);
  assert.equal(created.__v, 0);

  const updated = await users.upsert(
    { email: "user@example.com" },
    { name: "Israel Jatobá", visits: 5 },
  );

  assert.equal(updated._id, created._id);
  assert.equal(updated.name, "Israel Jatobá");
  assert.equal(updated.visits, 5);
  assert.equal(updated.__v, 1);
});

test("deleteMany works with and without filters", async () => {
  const { adapter } = createMemoryAdapter();
  const db = new Database({ storage: adapter });
  const schema = new Schema({
    email: { type: String, unique: true },
    verified: { type: Boolean, default: false },
  });
  const users = db.collection("users", schema);

  await users.create({ email: "one@example.com", verified: true });
  await users.create({ email: "two@example.com", verified: false });
  await users.create({ email: "three@example.com", verified: true });

  const deletedVerified = await users.deleteMany({ verified: true });
  assert.equal(deletedVerified, 2);
  assert.equal(await users.countDocuments(), 1);

  const deletedRemaining = await users.deleteMany();
  assert.equal(deletedRemaining, 1);
  assert.equal(await users.countDocuments(), 0);
});

test("updateOne rejects conflicting unique field updates", async () => {
  const { adapter } = createMemoryAdapter();
  const db = new Database({ storage: adapter });
  const schema = new Schema({
    email: { type: String, unique: true, lowercase: true },
    name: { type: String },
  });
  const users = db.collection("users", schema);

  const first = await users.create({ email: "one@example.com", name: "One" });
  await users.create({ email: "two@example.com", name: "Two" });

  await assert.rejects(
    () => users.updateOne({ _id: first._id }, { email: "two@example.com" }),
    /already exists/,
  );
});

test("findOne falls back to list scanning when readByIndexedField is unavailable", async () => {
  const { adapter, calls } = createMemoryAdapter({ withIndexedReads: false });
  const db = new Database({ storage: adapter });
  const schema = new Schema({
    email: { type: String, unique: true },
    name: { type: String },
  });
  const users = db.collection("users", schema);

  const created = await users.create({ email: "scan@example.com", name: "Scan" });
  const found = await users.findOne({ email: "scan@example.com" });

  assert.equal(found?._id, created._id);
  assert.equal(calls.indexedReads, 0);
});
