import { test, expect } from '@playwright/test';

test('portfolio navigation and slug page', async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';
  await page.goto(base + '/portfolio');
  await expect(page.getByRole('heading', { name: /Portfolio/i })).toBeVisible();

  // Navigate to a sample slug (use the first gallery item link if present)
  const link = page.locator('[data-e2e-id^="gallery-item-"] a, main a').first();
  if (await link.count() > 0) {
    await link.click();
    await expect(page.locator('h2')).toBeVisible();
  } else {
    // fallback: go to a known slug
    await page.goto(base + '/portfolio/test-slug');
    await expect(page.locator('h2')).toContainText('Portfolio item');
  }
});
