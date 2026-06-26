import { Elysia } from "elysia";

export const indexRoutes = new Elysia()
  .get(
    "/",
    () => ({
      message: "Hello, Tile.JS.",
    }),
    {
      detail: {
        summary: "Health check",
        tags: ["Default"],
      },
    },
  );
