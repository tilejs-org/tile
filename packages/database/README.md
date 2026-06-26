<div align="center">
  <!-- <img src="../../assets/..." width="456" alt="Tile.JS"></img> -->
  
  <p>
  <!-- Tile.JS badges -->
  <a href="https://www.npmjs.com/package/@tile.js/database">
    <img src="https://img.shields.io/npm/v/@tile.js/database?style=for-the-badge&color=36a5f4&label=npm&logo=npm" />
  </a>
  <a href="https://www.npmjs.com/package/@tile.js/database">
    <img src="https://img.shields.io/npm/dt/@tile.js/database?style=for-the-badge&color=f5a97f&label=downloads&logo=npm" />
  </a>
  <a href="https://github.com/tilejs-org/tile/tree/main/packages/database">
    <img src="https://img.shields.io/badge/github-@tile.js/database-8da6ce?style=for-the-badge&logo=github" />
  </a>
</p>
</div>

# Tile.JS Database

Um banco de dados local, leve e tipado para **Node.js** e **Bun**.

- 🚀 Zero configuração
- 📦 Armazenamento local em BSON
- 🔒 Schemas tipados com TypeScript
- ⚡ Sem servidor ou dependências externas
- 📁 Ideal para CLIs, bots, APIs e aplicações locais

## Instalação

```bash
npm install @tile.js/database
```

Ou com Bun:

```bash
bun add @tile.js/database
```

## Exemplo

```ts
import { Database, Schema } from "@tile.js/database";

interface User {
  _id?: string;
  name: string;
  email: string;
}

const userSchema = new Schema<User>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
  },
});

const connection = new Database();

const database = Object.assign(connection, {
  users: connection.collection<User>("users", userSchema),
});

await database.users.create({
  name: "Israel",
  email: "israel@gmail.com",
});

const user = await database.users.findOne({
  email: "israel@gmail.com",
});

console.log(user);
```

## Documentação

📚 A documentação completa está disponível em:

**https://tile.js.org/docs/database/get-started**

## Benchmark

### Ambiente

- **Runtime:** Bun 1.3.14
- **Sistema:** Linux x64
- **Documentos:** 10.000
- **Execuções:** 5 (média)

| Operação | Tempo médio |
| :-------- | ----------: |
| Insert    | 228.93 ms |
| Find      | 15.65 ms |
| Update    | 102.75 ms |
| Delete    | 56.43 ms |

## Links
- Tile.JS [website](https://tile.js.org/) | [Documentation](https://tile.js.org/docs).
- [GitHub](https://github.com/tilejs-org/tile) monorep.
- [NPM](https://www.npmjs.com/package/@tile.js/database), Latest version.

<p align="center">
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/footers/gray0_ctp_on_line.svg?sanitize=true"></img>
</p>


<p align="center">
  Copyright &copy; 2026, Israel R. Jatobá.
</p>

<p align="center">
<img src="https://img.shields.io/github/license/tilejs-org/tile?style=for-the-badge" />
</p>
