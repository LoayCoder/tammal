import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Workload Intelligence — Role-Based Access', () => {
  /* ------------------------------------------------------------------ */
  /*  Admin can access all workload routes                               */
  /* ------------------------------------------------------------------ */
  test('Admin can access all workload pages', async ({ page }) => {
    await loginAs(page, 'admin');

    const adminRoutes = [
      '/admin/workload/dashboard',
      '/admin/workload/team',
      '/admin/workload/executive',
      '/admin/workload/portfolio',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      // Should NOT redirect to home or auth
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(page.url()).toContain(route);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Manager can access team but not admin-only routes                  */
  /* ------------------------------------------------------------------ */
  test('Manager can access team page', async ({ page }) => {
    await loginAs(page, 'manager');

    await page.goto('/admin/workload/team');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(page.url()).toContain('/admin/workload/team');
  });

  test('Manager is redirected from admin-only routes', async ({ page }) => {
    await loginAs(page, 'manager');

    // AdminRoute-guarded pages should redirect managers away
    await page.goto('/admin/workload/dashboard');
    await page.waitForURL((url) => !url.pathname.includes('/admin/workload/dashboard'), {
      timeout: 10_000,
    });

    // Should be redirected to home or another allowed page
    expect(page.url()).not.toContain('/admin/workload/dashboard');
  });

  /* ------------------------------------------------------------------ */
  /*  Regular user cannot access admin workload routes                   */
  /* ------------------------------------------------------------------ */
  test('Regular user is redirected from all admin workload routes', async ({ page }) => {
    await loginAs(page, 'user');

    const adminRoutes = [
      '/admin/workload/dashboard',
      '/admin/workload/team',
      '/admin/workload/executive',
      '/admin/workload/portfolio',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForURL((url) => !url.pathname.startsWith('/admin'), {
        timeout: 10_000,
      });
      // Should be redirected away from admin area
      expect(page.url()).not.toContain('/admin');
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Regular user CAN access My Workload                                */
  /* ------------------------------------------------------------------ */
  test('Regular user can access My Workload page', async ({ page }) => {
    await loginAs(page, 'user');

    await page.goto('/my-workload');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(page.url()).toContain('/my-workload');
  });
});
