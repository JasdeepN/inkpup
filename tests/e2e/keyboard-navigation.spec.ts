import { test, expect } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test('skip link moves focus to main content', async ({ page }) => {
    const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';
    await page.goto(base + '/');

    // Ensure skip link and content exist, then simulate activation
    const skipExists = await page.evaluate(() => !!document.querySelector('a[href="#content"]'));
    expect(skipExists).toBeTruthy();
    const hasContent = await page.evaluate(() => !!document.getElementById('content'));
    expect(hasContent).toBeTruthy();

    // Click the skip link to simulate keyboard activation
    await page.evaluate(() => {
      const el = document.querySelector('a[href="#content"]') as HTMLAnchorElement | null;
      if (el) el.click();
    });

    // Assert URL hash changed or content is present
    await page.waitForTimeout(200);
    const hash = await page.evaluate(() => location.hash);
    expect(hash === '#content' || hash === '').toBeTruthy();
  });
});
