import { expect, type Locator, type Page } from '@playwright/test';

import { signInWithCode, test } from './fixtures';

type Manifest = { icons: { src: string; sizes: string; type: string }[] };

const IPHONE_ON_ITS_SIDE = { width: 844, height: 390 };
const ANDROID_ON_ITS_SIDE = { width: 740, height: 360 };
const NOTCH = 47;

function pngSizeOf(png: Buffer) {
  return [png.readUInt32BE(16), png.readUInt32BE(20)].join('x');
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Not on the screen');
  return box;
}

async function cutOutNotches(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { top: 0, right: NOTCH, bottom: 21, left: NOTCH },
  });
}

test('a visitor without a session gets the manifest and every icon in it', async ({
  request,
}) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  const { icons } = (await response.json()) as Manifest;

  for (const icon of icons) {
    const image = await request.get(icon.src, { maxRedirects: 0 });

    expect(image.status(), icon.src).toBe(200);
    expect(image.headers()['content-type']).toBe(icon.type);
    expect(pngSizeOf(await image.body()), icon.src).toBe(icon.sizes);
  }
});

test('Chrome offers to install the app', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Installability is a Chrome check');
  await page.goto('/sign-in');
  const cdp = await page.context().newCDPSession(page);

  const { installabilityErrors } = await cdp.send(
    'Page.getInstallabilityErrors',
  );

  expect(installabilityErrors).toEqual([]);
});

test('every page links the icon for the iPhone home screen', async ({
  page,
}) => {
  await page.goto('/sign-in');

  await expect(
    page.locator('link[rel="apple-touch-icon"]').first(),
  ).toHaveAttribute('href', /^\/apple-icon\/180/);
});

test('the page asks for the whole screen, notch included', async ({ page }) => {
  await page.goto('/sign-in');

  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /viewport-fit=cover/,
  );
});

test.describe('on a phone on its side', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Safe areas are emulated through CDP',
  );

  test.beforeEach(async ({ page, visitor }) => {
    await signInWithCode(page, visitor);
    await expect(page).toHaveURL('/calendar');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await cutOutNotches(page);
  });

  test('neither the sidebar nor the page hides under the notch', async ({
    page,
  }) => {
    await page.setViewportSize(IPHONE_ON_ITS_SIDE);
    await page.goto('/shelves');
    const sidebarLink = page
      .getByRole('complementary')
      .getByRole('link', { name: 'Calendar' });
    const newShelf = page
      .getByRole('main')
      .getByRole('button', { name: 'New shelf' })
      .first();

    expect((await boxOf(sidebarLink)).x).toBeGreaterThanOrEqual(NOTCH);
    const { x, width } = await boxOf(newShelf);
    expect(x + width).toBeLessThanOrEqual(IPHONE_ON_ITS_SIDE.width - NOTCH);

    await page.keyboard.press('ControlOrMeta+Backslash');
    await expect(sidebarLink).toBeHidden();
    const openSidebar = page
      .getByRole('main')
      .getByRole('button', { name: 'Open sidebar' });
    expect((await boxOf(openSidebar)).x).toBeGreaterThanOrEqual(NOTCH);
  });

  test('on a screen too narrow for the sidebar, the page and the tab bar clear the notch', async ({
    page,
  }) => {
    await page.setViewportSize(ANDROID_ON_ITS_SIDE);
    await page.goto('/shelves');
    const tabBar = page.getByRole('navigation');
    const heading = page.getByRole('heading', { level: 1, name: 'Shelves' });

    expect((await boxOf(heading)).x).toBeGreaterThanOrEqual(NOTCH);
    expect(
      (await boxOf(tabBar.getByRole('link', { name: 'Calendar' }))).x,
    ).toBeGreaterThanOrEqual(NOTCH);
    const { x, width } = await boxOf(
      tabBar.getByRole('link', { name: 'Search' }),
    );
    expect(x + width).toBeLessThanOrEqual(ANDROID_ON_ITS_SIDE.width - NOTCH);
  });
});
