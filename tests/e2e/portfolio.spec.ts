import { test, expect } from '@playwright/test';
import galleryData from '../../data/gallery.json';

type GalleryFixture = {
  category?: string;
  id?: string;
  src: string;
  alt?: string;
  caption?: string;
};

const grouped = (galleryData as GalleryFixture[]).reduce<Record<string, GalleryFixture[]>>((acc, item) => {
  if (!item.category) return acc;
  acc[item.category] ??= [];
  acc[item.category].push(item);
  return acc;
}, {});

const CATEGORY_LABELS: Record<string, string> = {
  healed: 'Healed',
  available: 'Available',
  flash: 'Flash',
  art: 'Art',
};

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';

test.describe('Portfolio gallery experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/gallery?category=*', async (route) => {
      const url = new URL(route.request().url());
      const category = url.searchParams.get('category') ?? 'healed';
      const payload = grouped[category] ?? grouped['healed'] ?? [];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: payload }),
      });
    });
  });

  test('loads each category and renders the expected number of items', async ({ page }) => {
    await page.goto(`${BASE_URL}/portfolio`);

    await expect(page.getByRole('heading', { name: /Portfolio/i })).toBeVisible();

    const grid = page.locator('.gallery-grid');

    for (const [category, label] of Object.entries(CATEGORY_LABELS)) {
      const tab = page.getByRole('tab', { name: label });

      if (await tab.isVisible()) {
        await tab.click();
      }

      await expect(grid).toHaveAttribute('data-state', 'idle');
      const items = page.locator('[data-e2e-id^="gallery-item-"]');
      const expectedCount = grouped[category]?.length ?? 0;
      await expect(items).toHaveCount(expectedCount);

      if (expectedCount > 0) {
        const firstCaption = grouped[category][0]?.caption || grouped[category][0]?.alt;
        if (firstCaption) {
          await expect(page.getByText(firstCaption)).toBeVisible();
        }
      }
    }
  });

  test('shows an error message when the gallery API fails', async ({ page }) => {
    await page.route('**/api/gallery?category=flash', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Unable to load gallery images.' }) });
    });

    await page.goto(`${BASE_URL}/portfolio`);

    await page.getByRole('tab', { name: CATEGORY_LABELS.flash }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Unable to load');
  });

  test('opens and closes the gallery modal when selecting an item', async ({ page }) => {
    await page.goto(`${BASE_URL}/portfolio`);

    const firstItem = page.locator('[data-e2e-id^="gallery-item-"] button').first();
    await firstItem.click();

    const modal = page.locator('.gallery-modal');
    await expect(modal).toBeVisible();

    await page.getByRole('button', { name: /close image preview/i }).click();
    await expect(modal).toHaveCount(0);
    await expect(firstItem).toBeFocused();
  });

  test('renders the legacy slug portfolio page', async ({ page }) => {
    await page.goto(`${BASE_URL}/portfolio/example-piece`);
    await expect(page.getByRole('heading', { name: /Portfolio item: example-piece/i })).toBeVisible();
  });
});
