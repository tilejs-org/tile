import { existsSync } from "fs";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "fs/promises";

import { spawn } from "node:child_process";

import {
  cancel,
  isCancel,
  select,
  text,
} from "@clack/prompts";

import chalk from "chalk";
import consola from "consola";
import ora from "ora";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";


import { createCommand } from "../core/command.js";

const logger = consola.withTag("create");

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEMPLATE_DIR = join(
  __dirname,
  "../../templates/package",
);

const PACKAGE_NAME_REGEX =
  /^(@[a-zA-Z0-9.-]+\/)?[a-zA-Z0-9.-]+$/;

type PackageManager =
  | "bun"
  | "npm"
  | "pnpm"
  | "yarn"
  | "none";

interface PackageForm {
  packageName: string;
  description: string;
  repository: string;
  homepage: string;
  authorName: string;
  authorUrl: string;
  packageManager: PackageManager;
}

function validateName(name?: string) {
  if (!name) {
    logger.error("Informe o nome do package.");
    process.exit(1);
  }

  if (!PACKAGE_NAME_REGEX.test(name)) {
    logger.error(
      "Nome inválido. Utilize 'meu-package' ou '@scope/meu-package'.",
    );
    process.exit(1);
  }
}

function getFolderName(packageName: string) {
  return packageName.split("/").pop()!;
}

function ensureNotExists(path: string) {
  if (existsSync(path)) {
    logger.error("Já existe uma pasta com esse nome.");
    process.exit(1);
  }
}

async function copyDir(src: string, dest: string) {
  await mkdir(dest, {
    recursive: true,
  });

  const entries = await readdir(src, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function promptPackageInfo(): Promise<PackageForm> {
  const packageName = await text({
    message: "Nome do package",
    placeholder: "@scope/meu-package",
    validate(value: any) {
      if (!value.trim()) {
        return "Informe um nome.";
      }

      if (!PACKAGE_NAME_REGEX.test(value.trim())) {
        return "Use 'meu-package' ou '@scope/meu-package'.";
      }
    },
  });

  if (isCancel(packageName)) {
    cancel("Operação cancelada.");
    process.exit(0);
  }

  const description = await text({
    message: "Description",
    placeholder: "Uma breve descrição...",
  });

  if (isCancel(description)) {
    cancel("Operação cancelada.");
    process.exit(0);
  }

  const repository = await text({
    message: "Repositório Git (opcional)",
    placeholder: "https://github.com/user/repo",
  });

  if (isCancel(repository)) {
    cancel("Operação cancelada.");
    process.exit(0);
  }

  const homepage = await text({
    message: "Homepage (opcional)",
    placeholder: "https://example.com",
  });

  if (isCancel(homepage)) {
    cancel("Operação cancelada.");
    process.exit(0);
  }

  const authorName = await text({
    message: "Nome do autor (opcional)",
    placeholder: "John Doe",
  });

  if (isCancel(authorName)) {
    cancel("Operação cancelada.");
    process.exit(0);
  }

  const authorUrl = await text({
    message: "URL do autor (opcional)",
    placeholder: "https://github.com/user",
  });

  if (isCancel(authorUrl)) {
    cancel("Operação cancelada.");
    process.exit(0);
  }

  const packageManager = await select({
    message: "Gerenciador de pacotes",
    options: [
      {
        value: "bun",
        label: "Bun",
        hint: "Recomendado",
      },
      {
        value: "npm",
        label: "npm",
      },
      {
        value: "pnpm",
        label: "pnpm",
      },
      {
        value: "yarn",
        label: "Yarn",
      },
      {
        value: "none",
        label: "Não instalar dependências",
      },
    ],
  });

  if (isCancel(packageManager)) {
    cancel("Operação cancelada.");
    process.exit(0);
  }

  return {
    packageName: packageName.trim(),
    description: description.trim(),
    repository: repository.trim(),
    homepage: homepage.trim(),
    authorName: authorName.trim(),
    authorUrl: authorUrl.trim(),
    packageManager,
  };
}

async function updatePackageJson(
  dir: string,
  form: PackageForm,
) {
  const pkgPath = join(dir, "package.json");

  if (!existsSync(pkgPath)) {
    return;
  }

  const pkg = JSON.parse(
    await readFile(pkgPath, "utf8"),
  );

  if (form.packageManager === "bun") {
    pkg.devDependencies = {
      "@types/bun": "latest",
      ...pkg.devDependencies,
    };

    delete pkg.devDependencies?.["@types/node"];
  } else {
    pkg.devDependencies = {
      "@types/node": "latest",
      ...pkg.devDependencies,
    };

    delete pkg.devDependencies?.["@types/bun"];
  }

  pkg.name = form.packageName;

  if (form.description) {
    pkg.description = form.description;
  } else {
    delete pkg.description;
  }

  if (form.homepage) {
    pkg.homepage = form.homepage;
  } else {
    delete pkg.homepage;
  }

  if (form.repository) {
    pkg.repository = {
      type: "git",
      url: form.repository,
    };

    pkg.bugs = {
      url:
        form.repository.replace(/\.git$/, "") +
        "/issues",
    };
  } else {
    delete pkg.repository;
    delete pkg.bugs;
  }

  if (form.authorName) {
    pkg.author = {
      name: form.authorName,
    };

    if (form.authorUrl) {
      pkg.author.url = form.authorUrl;
    }
  } else {
    delete pkg.author;
  }

  await writeFile(
    pkgPath,
    JSON.stringify(pkg, null, 2) + "\n",
  );
}

async function installDependencies(
  targetDir: string,
  manager: PackageManager,
) {
  if (manager === "none") {
    return;
  }

  const commands: Record<
    Exclude<PackageManager, "none">,
    string[]
  > = {
    bun: ["bun", "install"],
    npm: ["npm", "install"],
    pnpm: ["pnpm", "install"],
    yarn: ["yarn", "install"],
  };

  const spinner = ora({
    text: `Instalando dependências com ${manager}...`,
    spinner: "dots",
  }).start();

  const [command, ...args] = commands[manager];

  const proc = spawn(command, args, {
    cwd: targetDir,
    stdio: "inherit",
  });

  const code = await new Promise<number>((resolve, reject) => {
    proc.on("close", (code) => resolve(code ?? 1));
    proc.on("error", reject);
  });

  if (code === 0) {
    spinner.succeed("Dependências instaladas.");
  } else {
    spinner.fail("Erro ao instalar dependências.");
    process.exit(1);
  }
}

async function createPackage() {
  const form = await promptPackageInfo();

  validateName(form.packageName);

  const folderName = getFolderName(form.packageName);
  const targetDir = join(process.cwd(), folderName);

  ensureNotExists(targetDir);

  const spinner = ora({
    text: "Criando package...",
    spinner: "dots",
  }).start();

  try {
    spinner.text = "Copiando template...";
    await copyDir(TEMPLATE_DIR, targetDir);

    spinner.text = "Configurando package.json...";
    await updatePackageJson(targetDir, form);

    spinner.succeed("Package criado.");

    logger.success(
      chalk.green(form.packageName) +
        chalk.gray(" criado com sucesso."),
    );

    consola.info(
      chalk.gray("Local: ") +
        chalk.dim(targetDir),
    );

    await installDependencies(
      targetDir,
      form.packageManager,
    );

    console.log();

    consola.success(chalk.bold("Projeto criado com sucesso!"));

    console.log();

    console.log(
      `${chalk.bold("Package")}     ${chalk.green(form.packageName)}`,
    );

    console.log(
      `${chalk.bold("Diretório")}  ${chalk.dim(targetDir)}`,
    );

    console.log(
      `${chalk.bold("Gerenciador")} ${
        form.packageManager === "none"
          ? chalk.gray("Não instalado")
          : chalk.cyan(form.packageManager)
      }`,
    );

    console.log();

    consola.info("Próximos passos:");

    console.log(
      chalk.cyan(`  cd ${folderName}`),
    );

    if (form.packageManager === "none") {
      console.log(
        chalk.gray(
          "  bun install | npm install | pnpm install | yarn",
        ),
      );
    }
  } catch (error) {
    spinner.fail("Falha ao criar package.");
    logger.error(error);
    process.exit(1);
  }
}

export default createCommand({
  name: "create",
  description: "Cria um novo projeto.",

  async run() {
    const option = await select({
      message: "O que deseja criar?",
      options: [
        {
          value: "package",
          label: "Package",
          hint: "Cria um package a partir do template.",
        },
        // {
        //   value: "version",
        //   label: "Version",
        //   hint: "Exibe a versão da CLI.",
        // },
      ],
    });

    if (isCancel(option)) {
      cancel("Operação cancelada.");
      process.exit(0);
    }

    switch (option) {
      case "package":
        await createPackage();
        break;

      // case "version": {
      //   const pkg = JSON.parse(
      //     await readFile(
      //       join(__dirname, "../../package.json"),
      //       "utf8",
      //     ),
      //   );

      //   consola.info(
      //     `${chalk.bold("Versão")}: ${chalk.cyan(pkg.version)}`,
      //   );

      //   break;
      // }
    }
  },
});
