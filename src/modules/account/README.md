# account

Sign-in screens, passkeys, settings and personal MCP tokens; authenticates MCP requests.

Settings: `updateSettings` changes the theme, language, end of day, start of the week and time format of the signed-in
user, and its action also keeps the theme and the language in cookies for the pages without a user. The menu under
the name (and under the avatar on a phone) picks the theme and the language; the ⌘K palette's `ToggleThemeCommand`
flips the theme. The theme shows at once and stays even when saving fails: offline it is saved once the browser is
back online, and a refusal from the server shows a toast. The language can't change offline, as its messages come from
the server, so its pick stays as it was and a toast says why. Storybook swaps the actions for `__mocks__/actions.ts`.

- **Writes:** `user_settings` (updates; `src/server` creates the row), `api_token`, `mcp_rate_limit`.
  Better Auth writes its own tables.
- **Depends on:** no other module.
