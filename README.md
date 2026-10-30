# Kotsu

Open-source workspace for any goal you practise daily: a calendar with streaks and a year
heatmap, docs with flashcards, spreadsheets with formulas, a focus clock, and an MCP server so Claude or ChatGPT can plan with you.

## Status

Early days. The repository holds the project skeleton; no features work yet.

## Tech stack

Next.js 16 (App Router, React Compiler) · React 19 · TypeScript 6 · pnpm

## Architecture

A modular monolith: each product area is a module in [`src/modules`](src/modules), reached only through its
door files. Shared code lives in `src/ui`, `src/lib`, `src/server` and `src/i18n`, and `src/app` only maps
routes to modules. Decisions are recorded in [`docs/adr`](docs/adr).

## Getting started

Requirements: Node.js 26 (see `.nvmrc`) and pnpm 12.

```sh
pnpm install
pnpm dev
```

Then open http://localhost:5687.

## Scripts

| Script | Does |
|---|---|
| `pnpm dev` | starts the development server on port 5687 |
| `pnpm build` | builds for production |
| `pnpm start` | serves the production build on port 5687 |
| `pnpm typecheck` | generates route types and checks types |

## License

[AGPL-3.0-only](LICENSE). Why AGPL: [ADR 0002](docs/adr/0002-agpl-license.md).
