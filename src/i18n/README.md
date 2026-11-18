# i18n

next-intl without locale routing: URLs carry no language. Kotsu speaks English and Russian (`LOCALES` in
`src/lib/user-settings.ts`).

- **Which language:** a signed-in user's settings (`user_settings.locale`). Without a user, the `locale` cookie that
  the last pick on this device left, else the first of the browser's languages (`Accept-Language`) that Kotsu
  speaks, else English (`pickLocale` in `src/lib/pick-locale.ts`). `request.ts` does it for every request, and the
  root layout puts the result into `lang` on `<html>`.
- **Messages:** `messages/<locale>.json` at the repository root, one namespace per screen or area (`home`, `ui`
  for the UI kit's own words). Server Components call `useTranslations` or `getTranslations`; Client Components get
  the messages from the provider in the root layout. Keys and arguments are typed from `messages/en.json`; a test
  checks that every language has the same keys.
- **Dates and numbers:** `useFormatter` / `getFormatter` with the named date formats in `config.ts`, in the user's
  time zone and time format (24- or 12-hour) from their settings; UTC and 24-hour without a user.
- **Stories and component tests** render inside `IntlTestProvider` (`testing.tsx`); Storybook's toolbar switches
  its language.

Imports only from `src/i18n`, `src/lib` and `messages/`; `request.ts` also reads the signed-in user's settings from
`src/server`.
