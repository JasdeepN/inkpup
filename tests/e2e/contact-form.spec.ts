import { test, expect } from '@playwright/test';

test('contact form submits successfully', async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';
  await page.goto(base + '/contact');
  // Prefer data-testid selectors when available
  await page.fill('[data-testid="contact-name"]', 'Test User');
  await page.fill('[data-testid="contact-email"]', 'test@example.com');
  await page.fill('[data-testid="contact-message"]', 'Hello from Playwright');

  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/contact') && r.status() === 200),
  page.click('[data-testid="contact-submit"]')
  ]);

  expect(resp).toBeTruthy();
});
