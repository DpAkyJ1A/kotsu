# Kotsu

[![CI](https://github.com/DpAkyJ1A/kotsu/actions/workflows/ci.yml/badge.svg)](https://github.com/DpAkyJ1A/kotsu/actions/workflows/ci.yml)

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

| Script               | Does                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`           | starts the development server on port 5687                              |
| `pnpm build`         | builds for production                                                   |
| `pnpm start`         | serves the production build on port 5687                                |
| `pnpm typecheck`     | generates route types and checks types                                  |
| `pnpm lint`          | runs ESLint, including the module import rules                          |
| `pnpm format`        | formats everything with Prettier                                        |
| `pnpm format:check`  | checks formatting without changing files                                |
| `pnpm knip`          | finds unused files, exports and dependencies                            |
| `pnpm test`          | runs the unit tests                                                     |
| `pnpm test:browser`  | runs the component tests in a real browser                              |
| `pnpm test:coverage` | runs the unit and component tests with a coverage report in `coverage/` |
| `pnpm test:e2e`      | runs the end-to-end tests against a production build                    |
| `pnpm test:smoke`    | runs the `@smoke` end-to-end tests against `PLAYWRIGHT_BASE_URL`        |
| `pnpm check`         | runs typecheck, lint, format check, knip and the unit tests in one go   |

Git hooks (Lefthook) format and lint staged files before a commit, check the commit message
(Conventional Commits) and run the typecheck and unit tests before a push.

## Testing

| Kind       | Files                                  | Runs in                                                     |
| ---------- | -------------------------------------- | ----------------------------------------------------------- |
| Unit       | `*.test.ts`, next to the code          | Node                                                        |
| Component  | `*.browser.test.tsx`, next to the code | Chromium, through Vitest Browser Mode                       |
| End-to-end | `e2e/*.spec.ts`                        | Chromium at desktop size (1440×900), WebKit as an iPhone 17 |

The component and end-to-end tests run in Playwright's browsers, installed once:

```sh
pnpm exec playwright install chromium webkit
```

`pnpm test:e2e` builds the app and serves it on port 5687. Outside CI, a server already running on that
port (such as `pnpm dev`) is tested instead.

On GitHub, every pull request runs lint and the format check, typecheck, Knip, all three kinds of tests and
a production build in parallel, and checks that its title follows Conventional Commits, because the squash
merge makes the title the commit message. `main` takes changes only through a pull request with every check
green.

Vercel deploys a preview of every pull request and production from `main`. Once a deployment is live, the
end-to-end tests tagged `@smoke` (read-only, desktop Chromium) run against its URL. To run them against any
deployment yourself:

```sh
PLAYWRIGHT_BASE_URL=https://… VERCEL_AUTOMATION_BYPASS_SECRET=… pnpm test:smoke
```

The secret is needed only for previews, which sit behind Vercel's Deployment Protection.

## License

[AGPL-3.0-only](LICENSE). Why AGPL: [ADR 0002](docs/adr/0002-agpl-license.md).
