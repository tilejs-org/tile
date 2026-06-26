import { openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import z from "zod";

import { env } from "./env.js";
import { Package } from "./config/package.js";

// import { betterAuthPlugin, OpenAPI } from "#/http/plugins/better-auth";

import { indexRoutes } from "./http/routes/index.js";
// import { userRoutes } from "./http/routes/user.js";
import { aboutRoutes } from "./http/routes/about.js";
import { versionsRoutes } from "./http/routes/versions.js";

import { logger } from "./utils/logger.js";

const app = new Elysia({ name: "TileJS API", adapter: node() })
  .use(
    cors({
      origin: [env.TILE_DEV_URL, env.TILE_URL],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    }),
  )
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
      documentation: {
        info: {
          title: "TileJS API",
          version: Package.version,
          description: "Principal API for TileJS, Inc.",
        },
        // components: (await OpenAPI.components) as any,
        // paths: (await OpenAPI.getPaths()) as any,
        tags: [
          {
            name: "Default",
            description: "Default routes",
          },
          // {
          //   name: "User",
          //   description: "User related routes",
          // },
          // {
          //   name: "Auth system",
          //   description: "System authentication for users in routes",
          // },
        ],
      },
    }),
  )
  // .use(betterAuthPlugin)

  // Routes
  .use(indexRoutes)
  // .use(userRoutes)
  .use(aboutRoutes)
  .use(versionsRoutes)

  .listen(
    {
      port: env.DEFAULT_PORT,
    },
    (info) => {
      logger(`🔥 api is running at ${info.hostname}:${info.port}`);
    },
  );

export type App = typeof app;
