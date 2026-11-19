import { fn } from 'storybook/test';

const succeeded = { data: { success: true }, error: null };

export const authClient = {
  emailOtp: { sendVerificationOtp: fn(() => Promise.resolve(succeeded)) },
  signIn: {
    emailOtp: fn(() => Promise.resolve(succeeded)),
    passkey: fn(() => Promise.resolve(succeeded)),
    social: fn(() => Promise.resolve(succeeded)),
  },
  passkey: {
    addPasskey: fn(() => Promise.resolve(succeeded)),
    updatePasskey: fn(() => Promise.resolve(succeeded)),
    deletePasskey: fn(() => Promise.resolve(succeeded)),
  },
  useListPasskeys: fn(() => ({
    data: [],
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: fn(() => Promise.resolve()),
  })),
  linkSocial: fn(() => Promise.resolve(succeeded)),
  unlinkAccount: fn(() => Promise.resolve(succeeded)),
  signOut: fn(() => Promise.resolve(succeeded)),
  updateUser: fn(() => Promise.resolve(succeeded)),
};

export const browserSupportsWebAuthnAutofill = fn(() => Promise.resolve(false));

export const platformAuthenticatorIsAvailable = fn(() =>
  Promise.resolve(false),
);

export const WebAuthnAbortService = { cancelCeremony: fn() };
