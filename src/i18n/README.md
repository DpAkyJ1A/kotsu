# i18n

next-intl without locale routing: URLs carry no language. Kotsu speaks English and Russian (`config.ts`).

- **Which language:** the `locale` cookie when the user picked one, else the first of the browser's languages
  (`Accept-Language`) that Kotsu speaks, else English (`pick-locale.ts`). `request.ts` does it for every request,
  and the root layout puts the result into `lang` on `<html>`.
- **Messages:** `messages/<locale>.json` at the repository root, one namespace per screen or area (`home`, `ui`
  for the UI kit's own words). Server Components call `useTranslations` or `getTranslations`; Client Components get
  the messages from the provider in the root layout. Keys and arguments are typed from `messages/en.json`; a test
  checks that every language has the same keys.
- **Dates and numbers:** `useFormatter` / `getFormatter` with the named date formats in `config.ts`, in UTC until
  the user's time zone setting exists.
- **Stories and component tests** render inside `IntlTestProvider` (`testing.tsx`); Storybook's toolbar switches
  its language.

Imports only from `src/i18n`, `src/lib` and `messages/`.
