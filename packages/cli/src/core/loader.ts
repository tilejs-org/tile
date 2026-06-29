import { readdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 🔥 SOBE UM NÍVEL DO CORE
const baseDir = join(__dirname, "..", "commands");

export async function loadCommands() {
  await loadDirectory(baseDir);
}

async function loadDirectory(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadDirectory(fullPath);
      continue;
    }

    if (!entry.isFile()) continue;
    if (extname(entry.name) !== ".js" && extname(entry.name) !== ".ts") continue;

    await import(pathToFileURL(fullPath).href);
  }
}