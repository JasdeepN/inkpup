import { test, expect } from '@playwright/test';

test('portfolio navigation and slug page', async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
  await page.goto(base + '/portfolio');
  await expect(page.getByText(/Portfolio/i)).toBeVisible();

  // Navigate to a sample slug (use the first gallery item link if present)
  const link = page.locator('main a').first();
  if (await link.count() > 0) {
    await link.click();
    await expect(page.locator('h2')).toBeVisible();
  } else {
    // fallback: go to a known slug
    await page.goto(base + '/portfolio/test-slug');
    await expect(page.locator('h2')).toContainText('Portfolio item');
  }
});
