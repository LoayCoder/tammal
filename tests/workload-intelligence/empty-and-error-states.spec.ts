import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Workload Intelligence — Empty & Error States', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  /* ------------------------------------------------------------------ */
  /*  Empty filter results on Team page                                  */
  /* ------------------------------------------------------------------ */
  test('Team page shows empty state when filters match nothing', async ({ page }) => {
    await page.goto('/admin/workload/team');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Apply a very restrictive search to get zero results
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('zzz-nonexistent-task-9999');
    await page.waitForTimeout(500);

    // Page should not crash — heading still visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // No accordion items should be visible with content, or an empty state message shows
    // TODO: Adjust expected empty state text if translated
    const hasEmptyMessage = await page.getByText(/no results|no data|لا توجد/i).isVisible().catch(() => false);
    const hasNoAccordion = (await page.locator('[data-state="open"]').count()) === 0;

    // At least one of these should be true — either empty message or no open accordion
    expect(hasEmptyMessage || hasNoAccordion).toBeTruthy();
  });

  /* ------------------------------------------------------------------ */
  /*  Dashboard handles empty data gracefully                            */
  /* ------------------------------------------------------------------ */
  test('Dashboard does not crash with empty data tabs', async ({ page }) => {
    await page.goto('/admin/workload/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Switch through all tabs — none should crash
    const tabNames = [/capacity/i, /objectives/i, /off.hours/i];
    for (const tabName of tabNames) {
      await page.getByRole('tab', { name: tabName }).click();
      // Verify page is still functional after tab switch
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Executive Dashboard renders gracefully with zero metrics           */
  /* ------------------------------------------------------------------ */
  test('Executive Dashboard renders without crashing on empty analytics', async ({ page }) => {
    await page.goto('/admin/workload/executive');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // TAMMAL text should still render (even if value is 0 or loading)
    await expect(page.getByText(/tammal/i)).toBeVisible();

    // No uncaught errors — page structure intact
    const buttons = page.getByRole('button');
    await expect(buttons.first()).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  My Workload shows clean empty state                                */
  /* ------------------------------------------------------------------ */
  test('My Workload renders cleanly when user has no tasks', async ({ page }) => {
    // Log in as a user that may have no tasks
    // TODO: Use a test user known to have zero tasks for definitive assertion
    await page.goto('/my-workload');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Page should render stats section (even if values are 0)
    await expect(page.getByText(/active|نشط/i)).toBeVisible();

    // No crash — toggle group still present
    await expect(page.getByRole('group')).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Network error handling — API failure                               */
  /* ------------------------------------------------------------------ */
  test('Team page handles API failure gracefully', async ({ page }) => {
    // Intercept workload-related API calls and force a failure
    await page.route('**/rest/v1/objective_actions*', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    );

    await page.goto('/admin/workload/team');

    // Page should not show a white screen — heading or error boundary should render
    const hasHeading = await page.getByRole('heading', { level: 1 }).isVisible().catch(() => false);
    const hasErrorBoundary = await page.getByText(/error|something went wrong|خطأ/i).isVisible().catch(() => false);

    expect(hasHeading || hasErrorBoundary).toBeTruthy();
  });

  test('Executive Dashboard handles API failure gracefully', async ({ page }) => {
    // Intercept edge function calls
    await page.route('**/functions/v1/workload-analytics*', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    );

    await page.goto('/admin/workload/executive');

    // Should render page structure even if data fails
    const hasHeading = await page.getByRole('heading', { level: 1 }).isVisible().catch(() => false);
    const hasErrorBoundary = await page.getByText(/error|something went wrong|خطأ/i).isVisible().catch(() => false);

    expect(hasHeading || hasErrorBoundary).toBeTruthy();
  });
});
