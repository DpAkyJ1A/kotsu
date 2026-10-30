# 0001. Modular monolith with vertical slices

- Date: 2026-10-30
- Status: Accepted

## Context

Kotsu is one Next.js app with about ten product areas (calendar, shelves, docs, cards, practice, sheets,
search, clock, onboarding, account) and three entry points into the same logic: pages, Server Actions and an
MCP server. One person builds it and one deployment runs it. The areas share one Postgres schema whose
tables reference each other across areas.

Options considered:

- **Layer-first folders** (`components/`, `actions/`, `queries/`, …): one feature is spread over five
  folders, and nothing stops any file from importing any other.
- **Feature-Sliced Design**: made for frontend-only code; its layers clash with the App Router's `app/`
  folder.
- **Clean or hexagonal architecture throughout**: repositories and interfaces over Drizzle with no second
  implementation in sight.
- **Separate services or workspace packages**: deployment and versioning overhead for one developer and one
  database.

## Decision

Each product area is a module in `src/modules/<name>` with its own components, hooks, pure rules (`core/`)
and server-only logic (`domain/`). Code outside a module reaches it only through the module's root files, its
doors: `index.ts` for UI code, `actions.ts` for Server Actions, `loaders.ts` for pages, `mcp.ts` for the MCP
route, `api.ts` for other modules' server code.

Shared code lives in `src/ui`, `src/lib`, `src/server` and `src/i18n`. `src/app` only maps routes to
modules.

Each table has one module that writes it. Dependencies between modules form an acyclic graph. The import
rules are checked by `eslint-plugin-boundaries`, so a violation fails CI.

## Consequences

- Everything about an area sits in one folder; removing a feature means removing a folder and its routes.
- The doors make each module's public surface explicit and keep server code out of client bundles.
- The database schema stays in one place, `src/server/db/schema/`, because its tables reference each other
  across modules and the migration tool reads a single schema.
- Moving a module into its own package later means moving a folder whose surface is already explicit.
- A contributor needs to learn the doors and import rules first; the linter points out every violation.
