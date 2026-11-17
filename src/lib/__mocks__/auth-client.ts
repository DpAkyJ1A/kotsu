import { fn } from 'storybook/test';

const succeeded = { data: { success: true }, error: null };

export const authClient = {
  emailOtp: { sendVerificationOtp: fn(() => Promise.resolve(succeeded)) },
  signIn: { emailOtp: fn(() => Promise.resolve(succeeded)) },
  signOut: fn(() => Promise.resolve(succeeded)),
};
