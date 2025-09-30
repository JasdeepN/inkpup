import { test, expect } from '@playwright/test';

test('contact form submits successfully', async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
  await page.goto(base + '/contact');

  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'Hello from Playwright');

  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/contact') && r.status() === 200),
    page.click('button[type="submit"]')
  ]);

  expect(resp).toBeTruthy();
});
