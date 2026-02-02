---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: '*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json'
alwaysApply: false
---

When adding new features, update SPEC.md first.

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

## SVV Komponentkassen (svv-cli)

Use SVV Komponentkassen React components vendored into this repo with `svv-cli`.

- Config: `.svvrc.json` (componentRoot: `src/components/svv`, skin: `internal`)
- Initialize core styles (once): `svv init` (creates `src/components/svv/_core/`)
- Add components: `svv install svv-button`, `svv install svv-chip`, etc.
- Import CSS:
  - Core CSS once in app entry: `import './components/svv/_core/svv.css'`
  - Component CSS in app entry: e.g. `import '@komponentkassen/svv-button/svv-button.css'`, `import '@komponentkassen/svv-chip/svv-chip.css'`
- Prefer SVV components over custom UI:
  - Buttons: `SVVButton`, `SVVButtonIcon` from `@komponentkassen/svv-button`
  - Chips: `SVVChip`, `SVVChipGroup` from `@komponentkassen/svv-chip`
- Do not hand-edit vendored files under `src/components/svv/**`; re-run `svv install <component>` to update them.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

## NVDB API

When calling NVDB APIs via curl or similar, include the `X-Client` header:

```sh
curl -H "X-Client: nvdb-vis-vegobjekter" "https://nvdbapiles.atlas.vegvesen.no/..."
```

### Uberiket API

The uberiket API base URL is: `https://nvdbapiles.atlas.vegvesen.no/uberiket/api/v1`

Always use the uberiket API when fetching vegobjekter data.

## Formatting

After making changes to `.ts`, `.tsx`, `.js`, `.jsx`, or `.json` files, run `bun lint` silently to format and lint.

## Generated code

Never edit files under `src/api/generated` directly. Regenerate them with `bun run generate:api` after updating specs or `openapi-ts.config.ts`.
