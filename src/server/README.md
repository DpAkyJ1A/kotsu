# server

Server infrastructure that knows nothing about modules: environment variables, the database client and
schema, authentication, the request context (`Ctx`), and the helpers that domain code, Server Actions and MCP
tools are built with: `command()` in `domain.ts` checks a write's input with its Zod schema before it runs and
throws `AppError('VALIDATION')` otherwise, and `command.tx()` does the same inside one transaction, which it hands
on in `ctx.db`, so a write that fails undoes the ones before it; `defineAction()` in `actions.ts` turns a domain function into a Server
Action that takes the user from the session, refreshes the page after a write and answers with an `ActionResult`
(`{ ok: true, data }`, or `{ ok: false, error: { code } }` with an `AppError` code; any other failure is logged and
answered as `INTERNAL`).

Server only: every file starts with `import 'server-only'`. Imports only from `src/server` and `src/lib`.
`env.ts` is the only file that reads `process.env`.
