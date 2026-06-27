import { rm } from "node:fs/promises";
import { build } from "@tile.js/config/build";

await rm(new URL("./dist", import.meta.url), {
  recursive: true,
  force: true,
});

await build();
