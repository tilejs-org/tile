import { Elysia, t } from "elysia";
import { getRepository } from "../../services/github.js";

const WORKSPACES = {
  root: "package.json",
  database: "packages/database/package.json",
  api: "api/package.json",
  website: "website/package.json",
} as const;

type Workspace = keyof typeof WORKSPACES;

export const versionsRoutes = new Elysia({ prefix: "/versions" })

  /**
   * GET /versions
   * Retorna todas as versões do monorepo
   */
  .get(
    "/",
    async () => {
      const entries = await Promise.all(
        Object.entries(WORKSPACES).map(async ([key, path]) => {
          const pkg = await getRepository(path);

          return [
            key,
            {
              name: pkg.name,
              version: pkg.version,
            },
          ] as const;
        }),
      );

      return Object.fromEntries(entries);
    },
    {
      detail: {
        summary: "Get all workspace versions",
        tags: ["Versions"],
      },
    },
  )

  /**
   * GET /versions/:workspace
   */
  .get(
    "/:workspace",
    async ({ params, set }) => {
      const workspace = params.workspace as Workspace;
      const path = WORKSPACES[workspace];

      if (!path) {
        set.status = 404;
        return {
          error: "Workspace not found",
        };
      }

      const pkg = await getRepository(path);

      return {
        workspace,
        name: pkg.name,
        version: pkg.version,
      };
    },
    {
      params: t.Object({
        workspace: t.String(),
      }),
      detail: {
        summary: "Get version by workspace",
        tags: ["Versions"],
      },
    },
  )

  /**
   * GET /versions/badge/:workspace
   * Compatível com Shields.io
   */
  .get(
    "/badge/:workspace",
    async ({ params, set }) => {
      const workspace = params.workspace as Workspace;
      const path = WORKSPACES[workspace];

      if (!path) {
        set.status = 404;

        return {
          schemaVersion: 1,
          label: workspace,
          message: "not-found",
          color: "red",
        };
      }

      try {
        const pkg = await getRepository(path);

        return {
          schemaVersion: 1,
          label: workspace,
          message: pkg.version,
          color: "blue",
        };
      } catch {
        set.status = 500;

        return {
          schemaVersion: 1,
          label: workspace,
          message: "error",
          color: "red",
        };
      }
    },
    {
      params: t.Object({
        workspace: t.String(),
      }),
      detail: {
        summary: "Shields.io badge endpoint",
        tags: ["Versions"],
      },
    },
  );
