import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Database, Schema } from "../dist/index.js";

const originalCwd = process.cwd();

async function withTempWorkspace(run) {
  const dir = await mkdtemp(join(tmpdir(), "tile-db-test-"));
  process.chdir(dir);

  try {
    await run(dir);
  } finally {
    process.chdir(originalCwd);
    await rm(dir, { recursive: true, force: true });
  }
}

test("default adapter persists documents across database instances and enforces unique fields", async () => {
  await withTempWorkspace(async () => {
    const schema = new Schema({
      email: { type: String, unique: true, trim: true, lowercase: true },
      name: { type: String, required: true },
    });

    const firstDb = new Database({
      dbName: "integration",
      storage: "workspace",
    });
    const users = firstDb.collection("users", schema);

    const created = await users.create({
      email: " FIRST@EXAMPLE.COM ",
      name: "Israel",
    });

    await firstDb.disconnect();

    const secondDb = new Database({
      dbName: "integration",
      storage: "workspace",
    });
    const secondUsers = secondDb.collection("users", schema);

    const loaded = await secondUsers.findOneByID(created._id);
    assert.equal(loaded?.email, "first@example.com");
    assert.equal(loaded?.name, "Israel");

    await assert.rejects(
      () =>
        secondUsers.create({
          email: "first@example.com",
          name: "Duplicate",
        }),
      /already exists/,
    );

    await secondDb.disconnect();
  });
});
