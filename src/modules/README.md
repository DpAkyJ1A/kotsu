# Modules

One folder per product area. Everything about an area lives in its folder: components, hooks, rules and
data access. See [ADR 0001](../../docs/adr/0001-modular-monolith.md) for why.

## Inside a module

| Path         | Holds                                                      | Runs on                        |
| ------------ | ---------------------------------------------------------- | ------------------------------ |
| `index.ts`   | components, hooks and types for UI code outside the module | client and server              |
| `actions.ts` | Server Actions (`'use server'`)                            | server, called from the client |
| `loaders.ts` | reads for Server Components                                | server only                    |
| `mcp.ts`     | MCP tool definitions                                       | server only                    |
| `api.ts`     | functions that other modules' server code may call         | server only                    |
| `core/`      | types, Zod schemas and pure rules                          | client and server              |
| `domain/`    | queries, commands and DTOs                                 | server only                    |
| `ui/`        | components                                                 | client and server              |
| `hooks/`     | client hooks                                               | client                         |

The root files are the module's doors: code outside the module imports only them, never its folders. A
module has only the doors it needs. Doors re-export by name; there are no other barrel files.

## Rules

- A module writes only its own tables; it may read others in joins.
- Dependencies between modules go one way, as listed below. No cycles.
- Pure rules live in `core/` and are unit-tested; only `domain/` touches the database.

## Modules and their dependencies

| Module                    | Depends on                                                |
| ------------------------- | --------------------------------------------------------- |
| [account](account/)       | —                                                         |
| [shelves](shelves/)       | —                                                         |
| [cards](cards/)           | —                                                         |
| [docs](docs/)             | shelves, cards                                            |
| [sheets](sheets/)         | shelves                                                   |
| [calendar](calendar/)     | —                                                         |
| [practice](practice/)     | cards, calendar                                           |
| [search](search/)         | —                                                         |
| [onboarding](onboarding/) | account, shelves, cards, docs, sheets, calendar, practice |
| [clock](clock/)           | —                                                         |
