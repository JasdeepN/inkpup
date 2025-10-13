import { test, expect } from '@playwright/test';

test('homepage loads and displays header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('text=Portfolio')).toBeVisible();
});
