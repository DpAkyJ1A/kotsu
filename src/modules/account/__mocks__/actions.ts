import { fn } from 'storybook/test';

import type * as actions from '../actions';

export const updateSettingsAction = fn<typeof actions.updateSettingsAction>(
  () =>
    Promise.resolve({
      ok: true,
      data: {
        theme: 'system',
        locale: 'en',
        dayEndsAt: '04:00',
        weekStart: 'monday',
        timeFormat: 'h24',
      },
    }),
);
