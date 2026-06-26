import { Elysia } from "elysia";

export const indexRoutes = new Elysia()
  .get(
    "/",
    () => ({
      message: "Hello, TileJS.",
    }),
    {
      detail: {
        summary: "Health check",
        tags: ["Default"],
      },
    },
  );
