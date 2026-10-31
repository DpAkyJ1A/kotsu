# Kotsu

[![CI](https://github.com/DpAkyJ1A/kotsu/actions/workflows/ci.yml/badge.svg)](https://github.com/DpAkyJ1A/kotsu/actions/workflows/ci.yml)

Open-source workspace for any goal you practise daily: a calendar with streaks and a year
heatmap, docs with flashcards, spreadsheets with formulas, a focus clock, and an MCP server so Claude or ChatGPT can plan with you.

## Status

Early days. The repository holds the project skeleton, the design tokens (light and dark), the icon set and
the basic UI kit (buttons, fields, select, switch, checkbox, segmented control, chips, tooltips), shown in
Storybook (`pnpm storybook`); no features work yet.

## Tech stack

Next.js 16 (App Router, React Compiler) · React 19 · TypeScript 6 · Tailwind CSS 4 · shadcn/ui on Radix ·
Lucide icons · Storybook 10 · Postgres 18 (Neon) · Drizzle ORM · pnpm

## Architecture

A modular monolith: each product area is a module in [`src/modules`](src/modules), reached only through its
door files. Shared code lives in `src/ui`, `src/lib`, `src/server` and `src/i18n`, and `src/app` only maps
routes to modules. Every row carries its owner's id and every reference includes it, so the database itself
refuses a link between two users' data ([ADR 0003](docs/adr/0003-ownership-through-composite-keys.md)).
Decisions are recorded in [`docs/adr`](docs/adr).

## Getting started

Requirements: Node.js 26 (see `.nvmrc`), pnpm 12 and Docker.

```sh
pnpm install
cp .env.example .env
docker compose up -d db   # Postgres 18 on localhost:5433
pnpm db:migrate
pnpm dev
```

Then open http://localhost:5687. `docker compose down` stops the database and keeps its data;
`docker compose down -v` deletes it.

## Scripts

| Script               | Does                                                                             |
| -------------------- | -------------------------------------------------------------------------------- |
| `pnpm dev`           | starts the development server on port 5687                                       |
| `pnpm build`         | builds for production                                                            |
| `pnpm start`         | serves the production build on port 5687                                         |
| `pnpm typecheck`     | generates route types and checks types                                           |
| `pnpm lint`          | runs ESLint, including the module import rules                                   |
| `pnpm format`        | formats everything with Prettier                                                 |
| `pnpm format:check`  | checks formatting without changing files                                         |
| `pnpm knip`          | finds unused files, exports and dependencies                                     |
| `pnpm test`          | runs the unit tests                                                              |
| `pnpm test:db`       | runs the database tests against the Postgres in `DATABASE_URL`                   |
| `pnpm test:browser`  | runs the component tests and the stories in a real browser                       |
| `pnpm test:coverage` | runs the unit, database, component and story tests, with a report in `coverage/` |
| `pnpm test:e2e`      | runs the end-to-end tests against a production build                             |
| `pnpm test:smoke`    | runs the `@smoke` end-to-end tests against `PLAYWRIGHT_BASE_URL`                 |
| `pnpm storybook`     | opens Storybook on port 6006: the UI kit, every story, light and dark            |
| `pnpm db:generate`   | writes a migration into `drizzle/` from the schema in `src/server/db/schema`     |
| `pnpm db:migrate`    | applies the pending migrations to the database in `DATABASE_URL`                 |
| `pnpm db:studio`     | opens Drizzle Studio, a browser UI for the database                              |
| `pnpm check`         | runs typecheck, lint, format check, knip and the unit tests in one go            |

Git hooks (Lefthook) format and lint staged files before a commit, check the commit message
(Conventional Commits) and run the typecheck and unit tests before a push.

## Testing

| Kind       | Files                                  | Runs in                                                     |
| ---------- | -------------------------------------- | ----------------------------------------------------------- |
| Unit       | `*.test.ts`, next to the code          | Node                                                        |
| Database   | `*.db.test.ts`, next to the code       | Node, against Postgres 18                                   |
| Component  | `*.browser.test.tsx`, next to the code | Chromium, through Vitest Browser Mode                       |
| Story      | `*.stories.tsx`, next to the code      | Chromium, through Vitest Browser Mode, once per theme       |
| End-to-end | `e2e/*.spec.ts`                        | Chromium at desktop size (1440×900), WebKit as an iPhone 17 |

Every story is also a test: it has to render, pass its `play` function, if it has one, and show no
accessibility violations (axe), in the light theme and again in the dark one. Storybook's "Run tests" button
runs the same checks from its sidebar, in the light theme.

The component, story and end-to-end tests run in Playwright's browsers, installed once:

```sh
pnpm exec playwright install chromium webkit
```

`pnpm test:db` needs the database from `docker compose up -d db`. Each run creates a database of its own on
that server, applies the migrations and drops it at the end; each test runs in a transaction that is rolled
back, so tests never see each other's rows.

`pnpm test:e2e` builds the app and serves it on port 5687. Outside CI, a server already running on that
port (such as `pnpm dev`) is tested instead. The app needs its database here too.

On GitHub, every pull request runs lint and the format check, typecheck, Knip, every kind of test (the
database and end-to-end ones with a Postgres 18 service) and a production build in parallel, and checks that
its title follows Conventional Commits, because the squash merge makes the title the commit message. `main`
takes changes only through a pull request with every check green.

Vercel deploys a preview of every pull request and production from `main`. Each preview gets its own Neon
database branch, and every deployment applies the pending migrations before it builds (`vercel.json`). Once
a deployment is live, the end-to-end tests tagged `@smoke` (read-only, desktop Chromium) run against its URL,
including a request to `/api/health`, which answers only when the app reaches its database. To run them
against any deployment yourself:

```sh
PLAYWRIGHT_BASE_URL=https://… VERCEL_AUTOMATION_BYPASS_SECRET=… pnpm test:smoke
```

The secret is needed only for previews, which sit behind Vercel's Deployment Protection.

## License

[AGPL-3.0-only](LICENSE). Why AGPL: [ADR 0002](docs/adr/0002-agpl-license.md).
