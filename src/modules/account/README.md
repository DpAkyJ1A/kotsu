# account

Sign-in screens, passkeys, settings and personal MCP tokens; authenticates MCP requests.

Sign-in: the email code (`EmailForm`, `CodeForm`) and, when the server has Google keys, `GoogleSignIn` above it. Both
go on to the passkey offer on a device that can hold one (`hooks/page-after-sign-in.ts`), else to `next`. Google sends
failures back to `/sign-in?error=…`: a cancel (`SIGN_IN_CANCELLED`) just reloads the page clean, anything else shows
one message under the button.

Settings: `updateSettings` changes the theme, language, end of day, start of the week and time format of the signed-in
user, and its action also keeps the theme and the language in cookies for the pages without a user. The menu under
the name picks the theme and the language; the ⌘K palette's `ToggleThemeCommand` flips the theme. The theme shows at
once and stays even when saving fails: offline it is saved once the browser is back online, and a refusal from the
server shows a toast. The language can't change offline, as its messages come from the server, so its pick stays as it
was and a toast says why. Storybook swaps the actions for `__mocks__/actions.ts`.

The Settings window has sections (`SETTINGS_SECTIONS` in `core/settings-sections.ts`): Account (the name, saved through
Better Auth's `updateUser`) and Appearance (the five settings above). On a wide screen `SettingsDialog`, mounted by the
shell, opens over the current page from `?settings=<section>`: ⌘, / Ctrl+, , the menu's Settings item and the palette's
`OpenSettingsCommand` add it with `history.pushState` (no server request), switching sections replaces it, and closing
steps back, or drops the parameter when the page was loaded with it. `/settings` (`SettingsList`, behind the avatar on a
phone) and `/settings/[section]` (`SettingsSectionPage`) are plain pages.

Onboarding: `api.ts` gives other modules `markOnboarded`, which saves the time zone and the time of onboarding once
and answers whether this call did it.

- **Writes:** `user_settings` (updates; `src/server` creates the row), `api_token`, `mcp_rate_limit`.
  Better Auth writes its own tables.
- **Depends on:** no other module.
