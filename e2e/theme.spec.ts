import { expect, type Page, test } from '@playwright/test';

const LIGHT = 'rgb(255, 255, 255)';
const DARK = 'rgb(18, 18, 20)';

// Opens the page with a `theme` cookie and returns the HTML of that response
async function openWithTheme(page: Page, path: string, theme: string) {
  await page.goto(path);
  await page
    .context()
    .addCookies([{ name: 'theme', value: theme, url: page.url() }]);
  const response = await page.reload();
  return (await response?.text()) ?? '';
}

test('follows the system theme when none is picked', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);
});

test('renders the picked theme into the HTML, so the first paint has it', async ({
  page,
}) => {
  const html = await openWithTheme(page, '/', 'dark');

  expect(html).toContain('data-theme="dark"');
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);
});

test('a picked theme wins over the system one', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openWithTheme(page, '/', 'light');

  await expect(page.locator('body')).toHaveCSS('background-color', LIGHT);
});

test('ignores an unknown theme in the cookie', async ({ page }) => {
  await openWithTheme(page, '/', 'sepia');

  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
});

// A part of the page can force a theme (the clock, the theme previews in settings). No page has one yet, so
// the test adds two. It stays here, not in a story: story tests get `light-dark()` as written, and only the
// production build rewrites it.
test('a nested data-theme keeps its own theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByRole('main').evaluate((main) => {
    for (const theme of ['light', 'dark']) {
      const section = document.createElement('section');
      section.dataset.theme = theme;
      section.style.backgroundColor = 'var(--background)';
      main.append(section);
    }
  });

  await expect(page.locator('section[data-theme="light"]')).toHaveCSS(
    'background-color',
    LIGHT,
  );
  await expect(page.locator('section[data-theme="dark"]')).toHaveCSS(
    'background-color',
    DARK,
  );
});

test('sets Manrope as the font', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toHaveCSS('font-family', /^Manrope,/);
});
