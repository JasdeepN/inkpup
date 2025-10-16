import { test, expect } from '@playwright/test';

test.describe('About page', () => {
  test('displays studio details and contact CTA', async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('heading', { name: /about inkpup tattoos/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /studio details/i })).toBeVisible();
    await expect(page.locator('dt', { hasText: 'Location' })).toBeVisible();
    await expect(page.locator('dd').filter({ hasText: /toronto/i }).first()).toBeVisible();

    const bookCta = page.getByTestId('about-book');
    await expect(bookCta).toBeVisible();

    await Promise.all([
      page.waitForURL('**/contact'),
      bookCta.click(),
    ]);

    await expect(page.getByRole('heading', { name: /contact & booking/i })).toBeVisible();
  });
});
