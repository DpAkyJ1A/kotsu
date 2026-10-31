import './theme.css';

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { FlameIcon } from './icons';

test('an icon is as big as the text around it and takes its colour', async () => {
  const screen = await render(
    <p style={{ fontSize: 20, color: 'rgb(255, 0, 0)' }}>
      <FlameIcon />
    </p>,
  );
  const icon = screen.container.querySelector('svg');

  expect(icon?.getBoundingClientRect()).toMatchObject({
    width: 20,
    height: 20,
  });
  expect(icon && getComputedStyle(icon).stroke).toBe('rgb(255, 0, 0)');
});

test('an icon is hidden from screen readers unless it has a label', async () => {
  const screen = await render(
    <p>
      <FlameIcon />
      <FlameIcon aria-label="Streak" />
    </p>,
  );

  expect(
    screen.getByRole('img', { includeHidden: true }).elements(),
  ).toHaveLength(2);
  await expect.element(screen.getByRole('img')).toHaveAccessibleName('Streak');
});
