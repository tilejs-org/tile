import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Database, Schema } from "../dist/index.js";

const originalCwd = process.cwd();

async function withTempWorkspace(run) {
  const dir = await mkdtemp(join(tmpdir(), "tile-db-edge-"));
  process.chdir(dir);

  try {
    await run(dir);
  } finally {
    process.chdir(originalCwd);
    await rm(dir, { recursive: true, force: true });
  }
}

test("default adapter updates unique indexes when a unique field changes", async () => {
  await withTempWorkspace(async () => {
    const schema = new Schema({
      email: { type: String, unique: true, lowercase: true, trim: true },
      name: { type: String, required: true },
    });

    const db = new Database({ dbName: "edge", storage: "workspace" });
    const users = db.collection("users", schema);

    const first = await users.create({ email: "one@example.com", name: "One" });
    await users.updateOne({ _id: first._id }, { email: "two@example.com" });

    const reused = await users.create({ email: "one@example.com", name: "Two" });
    assert.equal(reused.email, "one@example.com");

    await db.disconnect();
  });
});

test("default adapter rebuilds a corrupted index file from committed documents", async () => {
  await withTempWorkspace(async () => {
    const schema = new Schema({
      email: { type: String, unique: true, lowercase: true, trim: true },
      name: { type: String, required: true },
    });

    const firstDb = new Database({ dbName: "edge", storage: "workspace" });
    const users = firstDb.collection("users", schema);
    const created = await users.create({ email: "one@example.com", name: "One" });
    await firstDb.disconnect();

    const corruptedIndexPath = join(
      process.cwd(),
      ".tile",
      "database",
      "edge",
      "users",
      "_collection_index_email.json",
    );

    await writeFile(corruptedIndexPath, "{not-json", "utf8");

    const secondDb = new Database({ dbName: "edge", storage: "workspace" });
    const secondUsers = secondDb.collection("users", schema);
    const loaded = await secondUsers.findOne({ email: "one@example.com" });

    assert.equal(loaded?._id, created._id);

    const rebuiltIndex = JSON.parse(await readFile(corruptedIndexPath, "utf8"));
    assert.equal(rebuiltIndex["one@example.com"], created._id);

    await secondDb.disconnect();
  });
});

test("default adapter migrates legacy JSON documents into BSON storage", async () => {
  await withTempWorkspace(async () => {
    const legacyCollectionPath = join(process.cwd(), ".tile", "legacy-db", "users");
    await mkdir(legacyCollectionPath, { recursive: true });

    await writeFile(
      join(legacyCollectionPath, "legacy-user.json"),
      JSON.stringify({
        _id: "legacy-user",
        email: "legacy@example.com",
        name: "Legacy",
      }),
      "utf8",
    );

    const schema = new Schema({
      email: { type: String, unique: true },
      name: { type: String, required: true },
    });

    const db = new Database({ dbName: "legacy-db", storage: "workspace" });
    const users = db.collection("users", schema);

    const loaded = await users.findOneByID("legacy-user");
    assert.equal(loaded?.email, "legacy@example.com");
    assert.equal(loaded?.name, "Legacy");

    const migratedBsonPath = join(
      process.cwd(),
      ".tile",
      "database",
      "legacy-db",
      "users",
      "legacy-user.bson",
    );
    assert.equal(existsSync(migratedBsonPath), true);

    await db.disconnect();
  });
});
