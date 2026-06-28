import { existsSync } from "fs";
import { mkdir, readdir, readFile, writeFile, copyFile } from "fs/promises";
import { join } from "path";
import { confirm } from "@clack/prompts";
import { spawn } from "bun";

import ora from "ora";
import chalk from "chalk";
import consola from "consola";

const TEMPLATE_DIR = join(process.cwd(), "templates/package");
const PACKAGES_DIR = join(process.cwd(), "packages");

const PREFIX_PACKAGE_NAME = "@tile.js";

const logger = consola.withTag("create:package");

const packageName = process.argv[2];

function validateName(name?: string) {
  if (!name) {
    logger.error("Informe o nome do package");
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    logger.error("Nome inválido (use kebab-case)");
    process.exit(1);
  }
}

function ensureNotExists(path: string) {
  if (existsSync(path)) {
    logger.error("Esse package já existe");
    process.exit(1);
  }
}

async function copyDir(src: string, dest: string) {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

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

async function updatePackageJson(dir: string, name: string) {
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) return;

  const raw = await readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(raw);

  pkg.name = `${PREFIX_PACKAGE_NAME}/${name}`;
  pkg.description = `${name} package`;
  pkg.repository.directory = `packages/${name}`;

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}

async function main() {
  validateName(packageName);

  const targetDir = join(PACKAGES_DIR, packageName!);
  ensureNotExists(targetDir);

  const spinner = ora({
    text: "Inicializando...",
    spinner: "dots",
  }).start();

  try {
    spinner.text = "Copiando template";
    await copyDir(TEMPLATE_DIR, targetDir);

    spinner.text = "Configurando package.json";
    await updatePackageJson(targetDir, packageName!);

    spinner.succeed("Package criado");

    logger.success(
      chalk.green(`${PREFIX_PACKAGE_NAME}/${packageName}`) + chalk.gray(" pronto para uso"),
    );

    consola.success(chalk.gray("Local:") + " " + chalk.dim(targetDir));

    const shouldInstall = await confirm({
      message: "Deseja instalar as dependências?",
      active: "Sim",
      inactive: "Não",
      initialValue: true,
    });

    if (shouldInstall) {
      const installSpinner = ora({
        text: "Instalando dependências...",
        spinner: "dots",
      }).start();

      console.log();

      const proc = spawn({
        cmd: ["bun", "install"],
        cwd: targetDir,
        stdout: "inherit",
        stderr: "inherit",
      });

      const exitCode = await proc.exited;

      if (exitCode === 0) {
        installSpinner.succeed("Dependências instaladas");
      } else {
        installSpinner.fail("Erro ao instalar dependências");
      }
    } else {
      consola.warn("Instalação ignorada");
    }
  } catch (err) {
    spinner.fail("Falha ao criar package");
    logger.error(err);
    process.exit(1);
  }
}

main();
