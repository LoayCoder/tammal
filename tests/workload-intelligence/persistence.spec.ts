import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Workload Intelligence — Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  /* ------------------------------------------------------------------ */
  /*  Team filters reset on reload (not URL-persisted)                   */
  /* ------------------------------------------------------------------ */
  test('Team page filters reset to defaults after reload', async ({ page }) => {
    await page.goto('/admin/workload/team');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Apply a status filter
    const statusTrigger = page.getByRole('combobox').first();
    await statusTrigger.click();
    await page.locator('[role="option"]').filter({ hasText: /in.progress|قيد التنفيذ/i }).click();

    // Reload the page
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Filters should reset to default "All" state
    // The status trigger should show default placeholder, not "In Progress"
    await expect(statusTrigger).not.toContainText(/in.progress/i);
  });

  /* ------------------------------------------------------------------ */
  /*  Dashboard tabs reset on reload                                     */
  /* ------------------------------------------------------------------ */
  test('Dashboard tabs reset to Capacity after reload', async ({ page }) => {
    await page.goto('/admin/workload/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Switch to Objectives tab
    await page.getByRole('tab', { name: /objectives/i }).click();

    // Reload
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Capacity tab should be the active default again
    const capacityTab = page.getByRole('tab', { name: /capacity/i });
    await expect(capacityTab).toHaveAttribute('data-state', 'active');
  });

  /* ------------------------------------------------------------------ */
  /*  Auth session persists across navigation                            */
  /* ------------------------------------------------------------------ */
  test('User remains authenticated when navigating between workload pages', async ({ page }) => {
    await page.goto('/admin/workload/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Navigate to team page
    await page.goto('/admin/workload/team');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Navigate to executive page
    await page.goto('/admin/workload/executive');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should NOT be redirected to /auth
    expect(page.url()).not.toContain('/auth');
  });
});
