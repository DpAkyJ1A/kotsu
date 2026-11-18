# 0004. Server Components and Server Actions, without tRPC or TanStack Query

- Date: 2026-11-18
- Status: Accepted

## Context

Kotsu's screens read a user's own data (settings, shelves, a doc, a week of events) and write small changes to it
(a theme, a tick, a renamed shelf). The same domain functions also serve the MCP server. The first write from the
interface is the settings menu, so this is where the way the browser reads and writes gets decided.

Options considered:

- **tRPC or oRPC**: a typed router over HTTP. Next.js already gives typed calls from the browser to the server
  (Server Actions are plain function imports), so a router would be a second transport with its own context,
  error format and client next to the one the framework has.
- **TanStack Query**: a client cache with keys to invalidate after each write. Every user's data is private and
  small, every read hits an index, and Server Components render it on the server; a client cache would be a second
  copy of it to keep in step.
- **next-safe-action**: a library for typed, validated actions. Validation already lives in the domain (it has to,
  for MCP), so the library would only wrap a call that takes a few lines.

## Decision

- Reads: Server Components call a module's loaders (`loaders.ts`), wrapped in React `cache()`, so a layout and a
  page that ask for the same data hit the database once.
- Writes: Server Actions made by `defineAction()` (`src/server/actions.ts`) from a domain command. It takes the user
  from the session, never from the input; the command checks the input with its Zod schema; after the write
  `refresh()` renders the page again with the new data; the answer is `{ ok: true, data }` or
  `{ ok: false, error: { code } }`, an `AppError` code the client shows as a translated message.
- The UI shows a change at once with `useOptimistic` and keeps it once the refreshed page arrives, or drops it
  and shows the error when the action fails. The theme is the exception: it belongs to the screen, so a failed save
  keeps it, and one that failed offline is sent again once the browser is back online.

## Consequences

- One way in for every write, from the interface and from MCP: the domain command and its schema.
- No client cache to invalidate: after a write the server renders the page with fresh data.
- A Server Action is a public POST endpoint. Each one gets the user from `getCtx()`, and its input goes through Zod
  like any other request.
- Search typeahead is the one read from the browser, as a plain `GET /api/search` (tasks 1.17 and 1.18).
- If Kotsu ever needs offline work or a long-lived client cache, this is the record to revisit.
