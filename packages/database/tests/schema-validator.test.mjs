import test from "node:test";
import assert from "node:assert/strict";

import { Database, Schema, Validator } from "../dist/index.js";

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

test("Schema.describe reflects internal options and field metadata", () => {
  const schema = new Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minLength: 5,
      },
      visits: {
        type: Number,
        default: 0,
        min: 0,
      },
      role: {
        type: String,
        enum: ["admin", "member"],
      },
    },
    {
      timestamps: false,
      collection: "users",
    },
  );

  const description = schema.describe();

  assert.equal(description.timestamps, false);
  assert.equal(description.collection, "users");
  assert.equal(description.fields._id.required, true);
  assert.equal(description.fields._id.unique, true);
  assert.equal(description.fields.email.lowercase, true);
  assert.equal(description.fields.email.trim, true);
  assert.equal(description.fields.email.minLength, 5);
  assert.deepEqual(description.fields.role.enum, ["admin", "member"]);
  assert.equal(description.fields.__v.required, true);
});

test("Schema.describe flattens nested field definitions into dot paths", () => {
  const schema = new Schema({
    account: {
      wallet: {
        money: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    },
  });

  const description = schema.describe();

  assert.equal(description.fields["account.wallet.money"].type, "Number");
  assert.equal(description.fields["account.wallet.money"].default, 0);
  assert.equal(description.fields["account.wallet.money"].min, 0);
});

test("Schema options disable timestamps and version key behavior in persisted documents", async () => {
  const db = new Database({ storage: createMemoryAdapter() });
  const schema = new Schema(
    {
      name: { type: String, required: true },
    },
    {
      timestamps: false,
      versionKey: false,
    },
  );

  const users = db.collection("users", schema);
  const created = await users.create({ name: "Israel" });

  assert.equal(created.__v, undefined);
  assert.equal(created.createdAt, undefined);
  assert.equal(created.updatedAt, undefined);

  const updated = await users.updateOne({ _id: created._id }, { name: "Israel J." });
  assert.equal(updated?.__v, undefined);
  assert.equal(updated?.updatedAt, undefined);
});

test("Validator enforces required, enum, string length, and numeric constraints", () => {
  assert.throws(
    () => Validator.validate(undefined, { required: true }, "email"),
    /Field "email" is required/,
  );

  assert.throws(
    () => Validator.validate("ab", { type: String, minLength: 3 }, "name"),
    /at least 3 characters/,
  );

  assert.throws(
    () => Validator.validate("abcdef", { type: String, maxLength: 3 }, "name"),
    /at most 3 characters/,
  );

  assert.throws(
    () => Validator.validate(1, { type: Number, min: 2 }, "visits"),
    /at least 2/,
  );

  assert.throws(
    () => Validator.validate(10, { type: Number, max: 5 }, "visits"),
    /at most 5/,
  );

  assert.throws(
    () => Validator.validate("guest", { type: String, enum: ["admin", "member"] }, "role"),
    /must be one of: admin, member/,
  );
});

test("Validator.processValue normalizes strings and hydrates Date values", () => {
  const normalized = Validator.processValue(
    "  USER@EXAMPLE.COM  ",
    { type: String, lowercase: true, trim: true },
    "email",
  );
  assert.equal(normalized, "user@example.com");

  const hydrated = Validator.processValue(
    "2026-01-01T00:00:00.000Z",
    { type: Date },
    "createdAt",
  );
  assert.ok(hydrated instanceof Date);
  assert.equal(hydrated.toISOString(), "2026-01-01T00:00:00.000Z");
});
