import { expect, test } from '@playwright/test';

test('the app reaches its database', { tag: '@smoke' }, async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});
