# AGENTS.md

## Overview

MCP server wrapping the `ast-outline` CLI (`uv tool install ast-outline`) as 4 tools: `outline`, `digest`, `show`, `grep`. Single ESM TypeScript package, no monorepo.

## Commands

| Command | What |
|---|---|
| `npm run build` | `tsc` — compiles `src/` → `dist/` |
| `npm test` | `jest --config jest.config.cjs` — all tests |
| `npm run lint` | `eslint src tests --max-warnings 0` — will fail on any warning |
| `npm start` | `node dist/index.js` — stdio MCP server |
| `npm run start:http` | `node dist/server/http-server.js` — SSE on `:3001/sse` |
| `npm run dev` | `tsc --watch` |

Run `build && lint && test` after making changes.

## Architecture

- `src/index.ts` — CLI entrypoint, starts `FastMCP` on stdio
- `src/server/http-server.ts` — HTTP entrypoint, SSE transport on `:3001`
- `src/server/server.ts` — creates `FastMCP` instance, wires up tools/prompts/resources
- `src/core/tools.ts` — registers 4 tools, each delegates to `AstOutlineService`
- `src/core/prompts.ts` — registers `explore-codebase` prompt
- `src/core/services/ast-outline-service.ts` — shells out to `ast-outline` binary via `execFile`
- No static resources (stateless by design)
- Binary path and timeout configurable via `AstOutlineOptions` (defaults: `"ast-outline"`, 30s)

## Key constraints

- **Requires `ast-outline` on PATH** — install with `uv tool install ast-outline`
- Node >= 18, `"type": "module"` (ESM)
- Imports use `.js` extensions (TypeScript `NodeNext` module resolution)
- Tests mock `execFile` — no real binary needed to run tests
- `ast-outline` CLI returns exit code 0 even for user-facing failures; service handles this by checking `stdout` presence before reporting errors

## Testing quirks

- `jest.config.cjs` — ts-jest preset overridden to `commonjs` module (tests tsconfig also overrides to commonjs)
- Test file pattern: `**/tests/**/*.test.ts`
- Module name mapper strips `.js` from imports: `"^(\\.{1,2}/.*)\\.js$": "$1"`
- Tests live in `tests/` (not `src/__tests__/`)

## Style conventions

- ESLint: `prefer-const` (error), `explicit-function-return-type` (warn), unused vars with `_` prefix ignored, `no-console` allowed
- Pre-commit: lint-staged runs `eslint --fix --max-warnings 0` on staged `.ts` files, then `npm test`

## Publishing

Manual via GitHub Actions: `workflow_dispatch` with version type. Uses `PAT_GITHUB` and `NPM_TOKEN` secrets. Creates GitHub release + npm publish with provenance.
