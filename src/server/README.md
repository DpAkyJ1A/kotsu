# server

Server infrastructure that knows nothing about modules: environment variables, the database client and
schema, authentication, the request context (`Ctx`), and the helpers that domain code, Server Actions and MCP
tools are built with.

Server only: every file starts with `import 'server-only'`. Imports only from `src/server` and `src/lib`.
`env.ts` is the only file that reads `process.env`.
