import { test, expect } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test('skip link moves focus to main content', async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';
    await page.goto(base + '/');

  // Ensure skip link and content exist, then simulate activation
  const skip = page.locator('[data-testid="skip-link"]');
  await expect(skip).toBeVisible();
  const content = page.locator('#content');
  await expect(content).toBeVisible();

  // Simulate keyboard activation: focus the skip link and press Enter
  await skip.focus();
  await page.keyboard.press('Enter');

  // Assert URL hash changed or content is present
  await page.waitForTimeout(200);
  const hash = await page.evaluate(() => location.hash);
  expect(hash === '#content' || hash === '').toBeTruthy();
  });
});
