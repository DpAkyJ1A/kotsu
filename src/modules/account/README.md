# account

Sign-in screens, passkeys, settings and personal MCP tokens; authenticates MCP requests.

- **Writes:** `user_settings` (updates; `src/server` creates the row), `api_token`, `mcp_rate_limit`.
  Better Auth writes its own tables.
- **Depends on:** no other module.
