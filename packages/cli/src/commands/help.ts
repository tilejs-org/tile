import { createCommand } from "../core/command.js";
import { registry } from "../core/registry.js";

export default createCommand({
  name: "help",
  aliases: ["-h", "--help"],
  description: "Mostra a ajuda da CLI",

  run(args: string[]) {
    const commands = registry.list();
    const target = args[0];

    if (target) {
      const cmd = registry.get(target);

      if (!cmd) {
        console.log(`Comando não encontrado: ${target}`);
        console.log(`Use: tile help`);
        return;
      }

      console.log(`
Tile CLI

Comando:
  tile ${cmd.name}

Uso:
  tile ${cmd.name}

Descrição:
  ${cmd.description ?? "Sem descrição"}

Aliases:
  ${cmd.aliases?.length ? cmd.aliases.join(", ") : "nenhum"}
`);
      return;
    }

    console.log(`
Tile CLI

Uso:

  tile <comando> -h   ajuda rápida do comando
  tile help <termo>   busca ajuda sobre um comando

Comandos disponíveis:

${commands
  .map((cmd) => {
    const aliases =
      cmd.aliases?.length ? ` (${cmd.aliases.join(", ")})` : "";

    const desc = cmd.description ?? "";

    return `  ${cmd.name}${aliases} - ${desc}`;
  })
  .join("\n")}

Dica:
  tile help <comando> para ver detalhes de um comando específico
`);
  },
});