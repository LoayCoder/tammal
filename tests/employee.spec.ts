import { test, expect } from '@playwright/test';

/**
 * Employee workload and task pages.
 * Uses textContent assertions to avoid hidden responsive element issues.
 */
test.describe('Workload – Personal Command Center', () => {
  test('loads My Workload page', async ({ page }) => {
    await page.goto('/my-workload');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/my-workload/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/workload|task|مهام|عبء|command/i);
  });
});

test.describe('Employee – Survey Page', () => {
  test('loads employee survey page', async ({ page }) => {
    await page.goto('/employee/survey');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/employee\/survey/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/survey|استبيان|question|response/i);
  });
});

test.describe('Employee – Wellness Check-in Page', () => {
  test('loads daily check-in page', async ({ page }) => {
    await page.goto('/employee/wellness');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/employee\/wellness/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/check.?in|wellness|كيف حالك|mood|feeling/i);
  });
});
