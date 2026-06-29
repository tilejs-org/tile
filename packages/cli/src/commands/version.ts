import { createCommand } from "../core/command.js";
import pkg from "../../package.json" with { type: "json" };

export default createCommand({
  name: "version",
  aliases: ["-v", "--version"],
  description: "Show CLI version",
  run() {
    console.log(`v${pkg.version}`);
  },
});