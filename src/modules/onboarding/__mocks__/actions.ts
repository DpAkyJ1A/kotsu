import { fn } from 'storybook/test';

import type * as actions from '../actions';

export const completeOnboardingAction = fn<
  typeof actions.completeOnboardingAction
>(() => Promise.resolve({ ok: true, data: undefined }));
