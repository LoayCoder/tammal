import { test, expect } from '@playwright/test';

/**
 * Spiritual feature pages – prayer tracker, Quran, calendar, sunnah.
 * Uses textContent assertions to avoid matching hidden responsive elements.
 */
test.describe('Spiritual – Prayer Tracker', () => {
  test('loads prayer tracker page with prayer list', async ({ page }) => {
    await page.goto('/spiritual/prayer');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/spiritual\/prayer/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/prayer|صلاة|fajr|dhuhr|asr|maghrib|isha/i);
  });
});

test.describe('Spiritual – Quran Reader', () => {
  test('loads Quran reader hub', async ({ page }) => {
    await page.goto('/spiritual/quran');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/spiritual\/quran/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/quran|قرآن|surah|سورة|read/i);
  });
});

test.describe('Spiritual – Islamic Calendar', () => {
  test('loads Islamic calendar page', async ({ page }) => {
    await page.goto('/spiritual/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/spiritual\/calendar/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/calendar|تقويم|hijri|هجري|islamic/i);
  });
});

test.describe('Spiritual – Sunnah Tracker', () => {
  test('loads Sunnah tracker page', async ({ page }) => {
    await page.goto('/spiritual/sunnah');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/spiritual\/sunnah/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/sunnah|سنة|adhkar|أذكار|daily|tracker/i);
  });
});
