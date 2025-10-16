import { test, expect } from '@playwright/test';

test.describe('Homepage experience', () => {
  test('renders hero copy and CTA buttons', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('hero-title')).toContainText(/tattoos/i);
    await expect(page.getByTestId('hero-subtitle')).toContainText(/toronto/i);
    await expect(page.getByTestId('hero-book')).toBeVisible();
    await expect(page.getByTestId('hero-portfolio')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('navigates between primary header links', async ({ page }) => {
    await page.goto('/');

    await Promise.all([
      page.waitForURL('**/portfolio'),
      page.getByTestId('nav-portfolio').click(),
    ]);
    await expect(page.getByRole('heading', { name: /portfolio/i })).toBeVisible();

    await Promise.all([
      page.waitForURL('**/about'),
      page.getByTestId('nav-about').click(),
    ]);
    await expect(page.getByRole('heading', { name: /about inkpup tattoos/i })).toBeVisible();

    await Promise.all([
      page.waitForURL((url: URL) => url.pathname === '/'),
      page.getByTestId('site-logo').click(),
    ]);
    await expect(page.getByTestId('hero-title')).toBeVisible();
  });

  test('hero "Book an appointment" CTA routes to contact page', async ({ page }) => {
    await page.goto('/');

    await Promise.all([
      page.waitForURL('**/contact'),
      page.getByTestId('hero-book').click(),
    ]);

    await expect(page.getByRole('heading', { name: /contact & booking/i })).toBeVisible();
    await expect(page.getByTestId('contact-submit')).toBeVisible();
  });
});
