import { fn } from 'storybook/test';

import type * as actions from '../actions';

export const createShelfAction = fn<typeof actions.createShelfAction>(
  ({ id = '', name, color = 'violet' }) =>
    Promise.resolve({ ok: true, data: { id, name, color } }),
);

export const updateShelfAction = fn<typeof actions.updateShelfAction>(
  ({ id, name = '', color = 'violet' }) =>
    Promise.resolve({ ok: true, data: { id, name, color } }),
);

export const moveShelfAction = fn<typeof actions.moveShelfAction>(() =>
  Promise.resolve({ ok: true, data: undefined }),
);

export const deleteShelfAction = fn<typeof actions.deleteShelfAction>(() =>
  Promise.resolve({ ok: true, data: undefined }),
);

export const createItemAction = fn<typeof actions.createItemAction>(
  ({ id = '', shelfId, kind, title }) =>
    Promise.resolve({ ok: true, data: { id, shelfId, kind, title } }),
);

export const renameItemAction = fn<typeof actions.renameItemAction>(
  ({ id, title }) =>
    Promise.resolve({
      ok: true,
      data: { id, shelfId: '', kind: 'doc', title },
    }),
);

export const moveItemAction = fn<typeof actions.moveItemAction>(() =>
  Promise.resolve({ ok: true, data: undefined }),
);

export const deleteItemAction = fn<typeof actions.deleteItemAction>(() =>
  Promise.resolve({ ok: true, data: undefined }),
);
