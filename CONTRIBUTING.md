<div align="center">
  <!-- <img src="../../assets/..." width="456" alt="Tile.JS"></img> -->
  
  <p>
  <!-- Tile.JS badges -->
  
<img src="https://img.shields.io/badge/Bun-1.x-black?style=for-the-badge&logo=bun" />
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />

</p>
</div>

Obrigado por considerar contribuir com o Tile.JS.

Este projeto é um monorepo mantido com Bun e organizado em múltiplos pacotes. Toda contribuição é bem-vinda, seja correção de bugs, melhorias de documentação, otimizações de performance ou novas funcionalidades.

## Antes de começar

- Verifique se já existe uma issue relacionada ao problema.
- Para mudanças grandes, abra uma discussão antes de começar a implementação.
- Mantenha as alterações focadas em um único objetivo.
- Evite mudanças não relacionadas no mesmo Pull Request.
- Para criar um package novo (com template pré-configurado) use: `bun create:package <package-name>`.

---
> [!important]
> ## Requisitos
>
> - Bun >= `1.x`
> - Git
>
> Verifique sua instalação:
>
> ```bash
> bun --version
> git --version
> ```
---

> [!WARNING]
> Toda alteração no projeto deve ser acompanhada da atualização da chave `version` no `package.json` do root do projeto.
>
> Regras:
>
> * `x.1.0` → Adição de funcionalidades, recursos ou melhorias.
> * `x.0.1` → Correções de bugs, refatorações e ajustes internos.
> * `1.0.0`, `2.0.0`, `3.0.0`... → Alterações incompatíveis com versões anteriores (*breaking changes*).
>
> Antes de abrir um Pull Request, verifique se a versão foi atualizada corretamente.

---

## Clonando o projeto

```bash
git clone https://github.com/tilejs-org/tile.git
cd tile
```

Instale as dependências:

```bash
bun install
```

---

## Estrutura do repositório

```bash
tile/
├── api
├── benchmarks/
│   ├── database/
│   └── ...
├── packages/
│   ├── base/ # modelo
│   ├── database/
│   └── ...
├── website
└── package.json
└── ...
```

Cada pacote deve ser o mais independente possível.

---

## Ambiente de desenvolvimento

Execute o build de todos os pacotes:

```bash
bun run build
```

Execute benchmarks (quando disponíveis):

```bash
bun run bench
```

---

## Padrões de código

### TypeScript

Utilizamos TypeScript moderno com ESM.

Prefira:

```ts
export class Database {}
```

Ao invés de:

```ts
export default class Database {}
```

---

### Nomenclatura

#### Classes

```ts
class Database {}
class Collection {}
class Schema {}
```

#### Interfaces e Types

```ts
interface DatabaseOptions {}
type CollectionData = {}
```

#### Constantes

```ts
const DEFAULT_PATH = "./data";
```

#### Arquivos

```text
database.ts
collection.ts
schema.ts
```

Utilize nomes em minúsculo separados por hífen quando necessário.

```text
file-storage.ts
memory-storage.ts
```

---

## Commits

Recomendamos o padrão Conventional Commits.

### Exemplos

```text
feat(database): add aggregation pipeline

fix(storage): resolve file locking issue

docs(readme): improve installation guide

refactor(core): simplify model creation

perf(database): optimize query execution
```

Tipos mais comuns:

| Tipo | Descrição |
|--------|-------------|
| feat | Nova funcionalidade |
| fix | Correção de bug |
| docs | Documentação |
| refactor | Refatoração |
| perf | Performance |
| test | Testes |
| chore | Manutenção |

---

## Pull Requests

Antes de abrir um Pull Request:

- Certifique-se de que o projeto compila.
- Certifique-se de que todos os testes passam.
- Atualize a documentação quando necessário.
- Mantenha o PR pequeno e objetivo.

Checklist recomendado:

```text
☐ Código compila sem erros
☐ Testes passam
☐ Documentação atualizada
☐ Sem código morto
☐ Sem arquivos temporários
```

---

## Documentação

Ao adicionar APIs públicas:

- Atualize o README do pacote afetado.
- Adicione exemplos de uso.
- Documente parâmetros e retornos.

Exemplo:

````ts
/**
 * Creates a collection instance.
 *
 * @param name Collection name.
 * @returns Collection instance.
 */
`````

---

## Benchmarks

Alterações relacionadas a performance devem incluir benchmarks sempre que possível.

Exemplo:

```bash
bun run bench
```

Inclua os resultados na descrição do Pull Request.

---

## Reportando Bugs

Ao abrir uma issue, tente incluir:

* Sistema operacional
* Versão do Bun
* Versão do pacote
* Código para reproduzir
* Resultado esperado
* Resultado atual

Modelo:

````md
### Environment

OS:
Bun:

### Reproduction

```ts
// code
```

### Expected Behavior

...

### Actual Behavior

...
````

---

## Segurança

Não reporte vulnerabilidades através de issues públicas.

Entre em contato através dos canais oficiais do projeto para divulgação responsável.

---

## Filosofia do Projeto

Tile.JS busca ser:

* Simples
* Rápido
* Tipado
* Modular
* Fácil de manter

Ao contribuir, priorize:

1. Legibilidade
2. Consistência
3. Performance
4. Experiência do desenvolvedor

---

## Licença

Ao enviar uma contribuição, você concorda que seu código será licenciado sob os termos da licença do projeto.

Obrigado por ajudar a construir o Tile.JS.

<p align="center">
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/footers/gray0_ctp_on_line.svg?sanitize=true"></img>
</p>

<p align="center">
  Copyright &copy; 2026, Israel R. Jatobá.
</p>

<p align="center">
<img src="https://img.shields.io/github/license/tilejs-org/tile?style=for-the-badge" />
</p>
