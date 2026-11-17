import { passkeyClient } from '@better-auth/passkey/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export {
  browserSupportsWebAuthnAutofill,
  platformAuthenticatorIsAvailable,
  WebAuthnAbortService,
} from '@simplewebauthn/browser';

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), passkeyClient()],
});
