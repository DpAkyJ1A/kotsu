# lib

Small helpers with no product rules that run on both client and server, such as fractional indexing, the
Better Auth client with the browser's WebAuthn checks from `@simplewebauthn/browser` (`auth-client.ts`; Storybook
swaps in `__mocks__/auth-client.ts`), and the way to the sign-in page and back (`sign-in-path.ts`: the home page,
`/sign-in?next=`, and the header in which `src/proxy.ts` tells server code the path that was asked for).

The palette's colours (`palette-colors.ts`), shared by the database enum and the shelves.

Also the one list of each choice in user settings (`user-settings.ts`: themes, languages, week starts, time formats),
which the database schema, the settings schema and the language picking share, and the two cookies that keep the
theme and the language on a device for the pages without a user: `theme-cookie.ts` and `pick-locale.ts`, which also
picks a visitor's language from the cookie and the browser's `Accept-Language`.

Imports only from `src/lib`.
