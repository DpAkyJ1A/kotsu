import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import HomePage from './page';

test('home page renders its main landmark', async () => {
  const screen = await render(<HomePage />);

  await expect.element(screen.getByRole('main')).toBeInTheDocument();
});
