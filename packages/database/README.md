<div align="center">
  <p>
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

Uma camada de persistência tipada para **Node.js** e **Bun** com:

- adapter local padrão em **BSON**
- **schemas** com validação e metadados
- suporte a adapters customizados
- integrações para **MongoDB** e **Mongoose**

## Instalação

```bash
npm install @tile.js/database
```

Ou com Bun:

```bash
bun add @tile.js/database
```

Se você quiser usar adapters externos, instale também a dependência correspondente no seu projeto:

```bash
npm install mongodb
npm install mongoose
```

## Exemplo rápido

```ts
import { Database, Schema } from "@tile.js/database";

interface User {
  _id?: string;
  name: string;
  email: string;
}

const userSchema = new Schema<User>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
});

const connection = new Database({
  dbName: "app",
});

const database = Object.assign(connection, {
  users: connection.collection<User>("users", userSchema),
});

await database.users.create({
  name: "Israel",
  email: "ISRAEL@GMAIL.COM",
});

const user = await database.users.findOne({
  email: "israel@gmail.com",
});

console.log(user);
```

## Adapters

A lib expõe os seguintes adapters:

- `@tile.js/database/adapters/default`
- `@tile.js/database/adapters/mongodb`
- `@tile.js/database/adapters/mongoose`

O adapter local é o padrão da lib. Os adapters de MongoDB e Mongoose utilizam o client/connection fornecido pelo consumidor final.

## Documentação

Documentação completa:

**https://tile.js.org/docs/database/get-started**

## Links

- Tile.JS [website](https://tile.js.org/) | [Documentation](https://tile.js.org/docs).
- [GitHub](https://github.com/tilejs-org/tile) monorepo.
- [NPM](https://www.npmjs.com/package/@tile.js/database), Latest version.
