import test from "node:test";
import assert from "node:assert/strict";

import { Database, Schema } from "../dist/index.js";

function createMemoryAdapter() {
  const collections = new Map();

  const getCollection = (name) => {
    let docs = collections.get(name);
    if (!docs) {
      docs = new Map();
      collections.set(name, docs);
    }
    return docs;
  };

  return {
    async prepareCollection(collection) {
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
  };
}

test("Database caches collections and exposes aliases consistently", async () => {
  const db = new Database({ storage: createMemoryAdapter() });
  const schema = new Schema({ email: { type: String, unique: true }, name: String });

  const usersFromCollection = db.collection("users", schema);
  const usersFromModel = db.model("users", schema);
  const usersFromGetCollection = db.getCollection("users");
  const usersFromGetModel = db.getModel("users");

  assert.equal(usersFromCollection, usersFromModel);
  assert.equal(usersFromCollection, usersFromGetCollection);
  assert.equal(usersFromCollection, usersFromGetModel);

  const created = await usersFromCollection.create({
    email: "alias@example.com",
    name: "Alias",
  });

  const byID = await usersFromCollection.findOneByID(created._id);
  const byId = await usersFromCollection.findOneById(created._id);

  assert.deepEqual(byID, byId);
});

test("Database.isConnected reflects connect and disconnect transitions", async () => {
  const db = new Database({ storage: createMemoryAdapter() });

  assert.equal(db.isConnected(), false);
  await db.connect();
  assert.equal(db.isConnected(), true);
  await db.disconnect();
  assert.equal(db.isConnected(), false);
});

test("Schema can disable timestamps and still expose friendly description metadata", () => {
  const schema = new Schema(
    {
      profile: { type: Object },
      tags: { type: Array },
      createdAtSource: { type: Date },
    },
    { timestamps: false },
  );

  const description = schema.describe();

  assert.equal(description.timestamps, false);
  assert.equal(description.fields.profile.type, "Object");
  assert.equal(description.fields.tags.type, "Array");
  assert.equal(description.fields.createdAtSource.type, "Date");
});

test("Model rejects invalid Date values after processing", async () => {
  const db = new Database({ storage: createMemoryAdapter() });
  const schema = new Schema({
    startAt: { type: Date, required: true },
  });
  const events = db.collection("events", schema);

  await assert.rejects(
    () => events.create({ startAt: "not-a-real-date" }),
    /valid Date/,
  );
});

test("Model rejects arrays for Object fields", async () => {
  const db = new Database({ storage: createMemoryAdapter() });
  const schema = new Schema({
    profile: { type: Object, required: true },
  });
  const users = db.collection("users", schema);

  await assert.rejects(
    () => users.create({ profile: ["unexpected-array"] }),
    /must be of type Object/,
  );
});
