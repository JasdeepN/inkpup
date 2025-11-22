import { test, expect } from '@playwright/test';

test.describe('Contact form - dynamic behavior', () => {
  test('preselects flash when design query param present', async ({ page }) => {
    await page.goto('/contact?design=flash-3');
    // wait until form loaded
    await page.waitForSelector('input[name="form_type"]');

    const flashRadio = page.locator('input[name="form_type"][value="flash"]');
    await expect(flashRadio).toBeVisible();
    await expect(flashRadio).toBeChecked();

    await expect(page.getByTestId('contact-placement')).toBeVisible();
    await expect(page.locator('input[name="design_id"]')).toHaveValue('flash-3');
    await expect(page.locator('input[name="booking_type"]')).toHaveValue('flash');
    await expect(page.getByTestId('contact-submit')).toHaveText('Request Booking');
  });

  test('preselects custom when type=custom query param present', async ({ page }) => {
    await page.goto('/contact?type=custom');
    await page.waitForSelector('input[name="form_type"]');

    const customRadio = page.locator('input[name="form_type"][value="custom"]');
    await expect(customRadio).toBeVisible();
    await expect(customRadio).toBeChecked();

    await expect(page.getByTestId('contact-concept')).toBeVisible();
    await expect(page.getByTestId('contact-placement-size')).toBeVisible();
    await expect(page.getByTestId('contact-submit')).toHaveText('Submit Consultation Request');
  });

  test('allows switching modes and updates hidden fields', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForSelector('input[name="form_type"]');

    // Switch to custom
    await page.locator('input[name="form_type"][value="custom"]').click();
    await expect(page.getByTestId('contact-concept')).toBeVisible();
    await expect(page.locator('input[name="booking_type"]')).toHaveValue('custom');
    await expect(page.getByTestId('contact-submit')).toHaveText('Submit Consultation Request');

    // Switch to flash
    await page.locator('input[name="form_type"][value="flash"]').click();
    await expect(page.getByTestId('contact-placement')).toBeVisible();
    await expect(page.locator('input[name="booking_type"]')).toHaveValue('flash');
    await expect(page.getByTestId('contact-submit')).toHaveText('Request Booking');

    // Switch to send message
    await page.locator('input[name="form_type"][value="contact"]').click();
    await expect(page.getByTestId('contact-message')).toBeVisible();
    await expect(page.locator('input[name="booking_type"]')).toHaveValue('contact');
    await expect(page.getByTestId('contact-submit')).toHaveText('Send');
  });
});
