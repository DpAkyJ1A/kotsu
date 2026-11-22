# Kotsu

[![CI](https://github.com/DpAkyJ1A/kotsu/actions/workflows/ci.yml/badge.svg)](https://github.com/DpAkyJ1A/kotsu/actions/workflows/ci.yml)

Open-source workspace for any goal you practise daily: a calendar with streaks and a year
heatmap, docs with flashcards, spreadsheets with formulas, a focus clock, and an MCP server so Claude or ChatGPT can plan with you.

## Status

Early days. The repository holds the project skeleton, the design tokens (light and dark), the icon set and
the basic UI kit (buttons, fields, select, switch, checkbox, segmented control, radio cards, chips, tooltips) with its
overlays (dialog, drawer, popover, dropdown menu, toasts with Undo) and the ⌘K command palette, shown in
Storybook (`pnpm storybook`). The interface speaks English and Russian: the browser's language picks one until
the user does. Signing in works: enter your email, type the 6-digit code from the email (the first code creates
the account), and private pages open; sessions live in Postgres. Continue with Google does the same in one step, and
lands in the account of the same email if it was made with a code. On a device with Touch ID, Face ID or a screen
lock, Kotsu then offers that device a passkey once, and the next sign-in picks it from the email field's
autofill. A new account first picks a starting point: Learn a language, Study a course, Job search & growth (each
shows the shelves it makes) or Start blank; the pick also saves the browser's time zone. Signed in, a desktop shell
opens on the calendar: a sidebar with the menu under your name and the
Calendar, Practice and Clock sections, still empty pages. The menu switches the theme (light, dark, or Auto to follow
the system) and the language at once, and saves both to the account, so they follow you to another device; it also
signs you out and opens Settings. Settings (⌘, or Ctrl+, from anywhere) open over the current page: Account changes
your name, Appearance picks the theme from three previews, the language, the hour your day ends, the first day of
the week and 12- or 24-hour time, and Sign-in & passkeys lists your passkeys, each named after its password manager
or the browser and system it was added on: rename one, remove one (the browser then drops it from its password manager
where it can), or add another from any authenticator; a sign-in older than a day asks for an emailed code first. Where Google
sign-in is on, the same section connects the Google account of your email or disconnects it (email codes keep working).
⌘\ or Ctrl+\ hides the sidebar, the choice survives a reload, and a hidden sidebar slides in while the pointer rests
on the left edge of the window. On a phone or a
narrow window the sidebar gives way to a tab bar at the bottom (Calendar, Shelves, Practice, Clock, Search), and
your avatar at the top right of Calendar and Shelves leads to the Settings screen, where each section is a page of
its own. ⌘K or Ctrl+K, or the search field at the top of the sidebar, opens the command palette: type to filter,
then jump to a section, open Settings or switch between the light and dark theme. Shelves work too: under the sections
the sidebar lists your shelves, and on a phone the Shelves tab does. The + makes one (type a name, Enter), each shelf
gets its own colour, and its ⋯ menu renames it, recolours it or deletes it, with Undo for five seconds. Drag a shelf to
reorder (on a phone, press and hold it first; from the keyboard, Tab to its move handle, then Space and the arrows). A
shelf opens its own page with its docs as tiles. The dashed + tile first in line makes a doc: type its title, Enter, and
the doc opens with the caret in its text (on a phone, tap the page: the keyboard opens only for a tap). A doc is a
column of text with its title on top, and a click or tap anywhere under the text goes on at its end: type and use
Markdown as you go (`#`, `##` and `###` for headings, `-` or `*` for a list, `1.` for a numbered one, `[]` for a
checklist, `>` for a quote, three backticks for code, `---` for a line, and `**bold**`, `*italic*`, `~~strike~~`,
`` `code` ``), or type `/` at the start of a line or after a space to pick a block from a menu (a new doc says so, and
so does the empty line you are on: "Type / for blocks"): what follows narrows it (`/h2`, `/todo`, `/heading 2`; a space
that leaves nothing to find closes it), the arrows and Enter pick, Escape leaves the text as it is. A block picked on an
empty line takes that line; on a line with text it goes below it. For now the text lives only on the page: saving it
comes next. The title saves itself once you pause or leave it, Enter goes on to the text, and the sidebar and the line
above it ("Spanish › Verbs") follow at once. On a shelf's page a double-click on a doc's title renames it, and its ⋯
menu renames it, moves it to the end of another shelf or deletes it, with Undo for five seconds. A shelf that holds docs
asks first: its delete window lists the docs that go with it, and deletes only once you type the shelf's name. In the
sidebar each shelf lists its docs under it: the arrow beside a shelf folds it away (this device remembers), the + in its
row makes a doc there, and a doc dragged onto another doc or another shelf moves there. Tiles on a shelf's page drag
into a new order too, by mouse, by a long press on a phone, or from the keyboard. Kotsu also installs as an app: Chrome
offers it in the address bar, an iPhone adds it with Share → Add to Home Screen, and it opens in a window of its own,
without the browser's bars, its title bar in the colours of the theme you picked. And it runs on your own server: one
Docker Compose command starts the app with its database (see [Self-hosting](#self-hosting)). The privacy policy at
`/privacy` opens without an account, in English and Russian, and the sign-in page links to it.

## Tech stack

Next.js 16 (App Router, React Compiler) · React 19 · TypeScript 6 · Tailwind CSS 4 · shadcn/ui on Radix ·
Sonner · cmdk · dnd-kit · Tiptap · next-intl · Lucide icons · Storybook 10 · Postgres 18 (Neon) · Drizzle ORM · Better Auth ·
Resend · pnpm · Docker

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
sed "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 32)|" .env.example > .env
docker compose up -d db   # Postgres 18 on localhost:5433
pnpm db:migrate
pnpm dev
```

The second line copies `.env.example` to `.env` and fills in `BETTER_AUTH_SECRET` with a random key: it signs
sessions and encrypts sign-in codes.

Then open http://localhost:5687. Without `RESEND_API_KEY` in `.env`, sign-in codes are printed in the terminal
of `pnpm dev` instead of being emailed; a production build without the key can't send them. Continue with Google
shows only with both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set: an OAuth client of type Web application from
the Google Cloud Console whose redirect URI is `http://localhost:5687/api/auth/callback/google` (and the same path on
your own domain). `docker compose down`
stops the database and keeps its data; `docker compose down -v` deletes it.

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
database and end-to-end ones with a Postgres 18 service), a production build, and the self-hosting setup (it builds the
Docker image, starts it with `self-host/compose.yaml` and runs the `@smoke` tests against it) in parallel, and checks that
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

## Self-hosting

Kotsu runs on any machine with Docker. The [`Dockerfile`](Dockerfile) builds the production server, and
[`self-host/compose.yaml`](self-host/compose.yaml) runs it with Postgres 18:

```sh
git clone https://github.com/DpAkyJ1A/kotsu.git
cd kotsu/self-host
cp .env.example .env   # fill in BETTER_AUTH_SECRET and POSTGRES_PASSWORD: openssl rand -hex 32
docker compose up -d
```

`docker compose up` builds the image, waits for the database, applies the migrations (the `migrate` service runs
once and exits) and starts the app on http://localhost:3000. `docker compose logs -f app` follows its log;
`git pull && docker compose up -d --build` updates it; `docker compose down` stops it and keeps the data, which
`docker compose down -v` deletes.

The settings live in `self-host/.env`:

| Variable                                   | Does                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`                                  | the address people open Kotsu at, such as `https://kotsu.example.com`. Sign-in takes requests only from it and ties passkeys to its host, so passkeys made under one host don't work under another                                                                          |
| `BETTER_AUTH_SECRET`                       | signs sessions and encrypts sign-in codes, at least 32 characters                                                                                                                                                                                                           |
| `POSTGRES_PASSWORD`                        | the database's password; letters and digits only, since it goes into the database URL                                                                                                                                                                                       |
| `RESEND_API_KEY`, `EMAIL_FROM`             | email sign-in codes through [Resend](https://resend.com), from an address on a domain verified there                                                                                                                                                                        |
| `SIGN_IN_CODES_IN_LOG`                     | `true` prints sign-in codes in `docker compose logs app` instead of emailing them: enough when the server is yours alone, since after the first sign-in a passkey can take over. With neither this nor Resend, a code has nowhere to go and sign-in fails                   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | turn on Continue with Google: an OAuth client of type Web application from the Google Cloud Console, with the redirect URI `<APP_URL>/api/auth/callback/google`                                                                                                             |
| `TRUSTED_PROXIES`                          | proxies (addresses or CIDR ranges, comma-separated) whose entries in `X-Forwarded-For` count. Sign-in limits code requests per visitor's address and reads it from that header; set this only if your proxy appends to the header (nginx with `$proxy_add_x_forwarded_for`) |

The app listens on 127.0.0.1:3000 only, so the internet reaches it through an HTTPS proxy on the same machine:
passkeys and secure cookies need HTTPS everywhere but `localhost`. [Caddy](https://caddyserver.com) gets the
certificate itself and replaces `X-Forwarded-For` with the visitor's address, so this is its whole Caddyfile:

```
kotsu.example.com {
	reverse_proxy localhost:3000
}
```

To run the image without Compose, start `node migrate.ts` in it once per update before the server, with the same
`DATABASE_URL`; the server itself is the image's default command.

The privacy policy at `/privacy` is the one of kotsu.devazx.com: it names who runs that copy and the services it runs
on (Vercel, Neon, Resend). A copy of your own needs its own: the text is under `privacy` in `messages/en.json` and
`messages/ru.json`, the address, the operator, the contact and the date at the top of
[`privacy-policy.tsx`](src/modules/account/ui/privacy-policy.tsx).

## License

[AGPL-3.0-only](LICENSE). Why AGPL: [ADR 0002](docs/adr/0002-agpl-license.md).
