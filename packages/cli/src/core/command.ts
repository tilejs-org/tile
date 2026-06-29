import { registry } from "./registry.js";

export type CommandHandler = (args: string[]) => void | Promise<void>;

export interface Command {
  name: string;
  aliases?: string[];
  description?: string;
  run: CommandHandler;
}

export function createCommand(command: Command) {
  registry.register(command);
  return command;
}