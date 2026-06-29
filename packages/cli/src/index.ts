#!/usr/bin/env node

import { loadCommands } from "./core/loader.js";
import { registry } from "./core/registry.js";

async function main() {
  await loadCommands();

  const args = process.argv.slice(2);
  const cmdName = args[0];

  if (!cmdName) {
    const help = registry.get("help");
    return help?.run([]);
  }

  const command = registry.get(cmdName);

  if (!command) {
    console.error(`Unknown command: ${cmdName}`);
    console.log(`Run 'tile help'`);
    process.exit(1);
  }

  await command.run(args.slice(1));
}

main();