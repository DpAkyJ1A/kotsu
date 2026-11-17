# lib

Small helpers with no product rules that run on both client and server, such as fractional indexing, the
Better Auth client with the browser's WebAuthn checks from `@simplewebauthn/browser` (`auth-client.ts`; Storybook
swaps in `__mocks__/auth-client.ts`), and the way to the sign-in page and back (`sign-in-path.ts`: the home page,
`/sign-in?next=`, and the header in which `src/proxy.ts` tells server code the path that was asked for).

Imports only from `src/lib`.
