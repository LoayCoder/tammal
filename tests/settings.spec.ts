import { test, expect } from '@playwright/test';

/**
 * Settings pages – user profile and billing.
 */
test.describe('Settings – User Profile', () => {
  test('loads profile page with user information', async ({ page }) => {
    await page.goto('/settings/profile');

    // Should display profile form or user info
    await expect(
      page.getByText(/profile|الملف|account|الحساب/i).first()
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('body')).not.toContainText(/unexpected error/i);
  });
});

test.describe('Settings – Usage & Billing', () => {
  test('loads usage/billing page', async ({ page }) => {
    await page.goto('/settings/usage');

    await expect(
      page.getByText(/usage|billing|استخدام|فوترة/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Support Page', () => {
  test('loads support page', async ({ page }) => {
    await page.goto('/support');

    await expect(
      page.getByText(/support|help|مساعدة|دعم/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
