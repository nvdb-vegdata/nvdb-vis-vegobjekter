import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig([
  {
    input: {
      path: "./specs/datakatalog.json",
    },
    output: {
      path: "src/api/generated/datakatalog",
      clean: true,
    },
    plugins: [
      "@hey-api/typescript",
      "@hey-api/client-fetch",
      "@hey-api/sdk",
      {
        name: "zod",
        exportFromIndex: true,
      },
    ],
  },
  {
    input: {
      path: "./specs/uberiket.json",
    },
    output: {
      path: "src/api/generated/uberiket",
      clean: true,
    },
    plugins: [
      "@hey-api/typescript",
      "@hey-api/client-fetch",
      "@hey-api/sdk",
      {
        name: "zod",
        exportFromIndex: true,
      },
    ],
  },
]);
