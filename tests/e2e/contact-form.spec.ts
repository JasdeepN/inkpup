import { test, expect } from '@playwright/test';

test.describe('Contact form', () => {
  test('prevents submission when required fields are empty', async ({ page }) => {
    await page.goto('/contact');

    await page.getByTestId('contact-submit').click();

    await expect(page.getByTestId('contact-name')).toBeFocused();
    const isInvalid = await page.getByTestId('contact-name').evaluate((el: HTMLInputElement) => el.matches(':invalid'));
    expect(isInvalid).toBe(true);
  });

  test('submits successfully with valid data', async ({ page }) => {
    await page.goto('/contact');
    // Prefer data-testid selectors when available
    await page.fill('[data-testid="contact-name"]', 'Test User');
    await page.fill('[data-testid="contact-email"]', 'test@example.com');
    await page.fill('[data-testid="contact-message"]', 'Hello from Playwright');

    // Click submit and wait for navigation (native form submission)
    await page.click('[data-testid="contact-submit"]');
    await page.waitForURL('**/contact?success=true', { waitUntil: 'domcontentloaded' });

    // Verify success message is shown
    await expect(page.locator('text=Message sent successfully')).toBeVisible();
  });
});
