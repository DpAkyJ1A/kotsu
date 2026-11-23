import { fn } from 'storybook/test';

import type * as actions from '../actions';

export const saveDocAction = fn<typeof actions.saveDocAction>(({ version }) =>
  Promise.resolve({ ok: true, data: { version: version + 1 } }),
);
