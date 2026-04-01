import { test, expect } from '@playwright/test';

/**
 * 404 Page – run WITHOUT stored session (unauthenticated project).
 */
test.describe('404 Not Found', () => {
  test('shows 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist');

    // Should show a Not Found message
    await expect(
      page.getByText(/not found|404|غير موجود/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
