## What

## Why

## How to test

## Screenshots

<!-- UI changes only: desktop and mobile, light and dark -->

## Checklist

- [ ] Scope: this task and nothing else, small enough to read in one sitting
- [ ] Boundaries: no lint rule disabled, no new barrel, server files start with `server-only`,
      `'use client'` only on leaves
- [ ] Language: names from the glossary, kebab-case files, named exports
- [ ] Types: no `any`, `!` or unexplained `as`; input parsed by Zod at the boundary; DTOs out
- [ ] Data: every query filters by `ctx.userId`, the module writes only its own tables, no N+1,
      a "user B" test for new data
- [ ] Errors: `AppError` codes, nothing swallowed, messages are i18n keys
- [ ] Tests: behaviour covered at the right level, deterministic, nothing skipped
- [ ] UI: tokens only, light and dark, desktop and mobile checked in a browser, keyboard and screen
      reader, no text literals, reduced motion
- [ ] Performance: no request waterfalls, heavy libraries loaded only where used
- [ ] Security: no secrets, links http(s) only, tokens never logged
- [ ] Docs: README updated for a visible feature, an ADR if a real decision was made
