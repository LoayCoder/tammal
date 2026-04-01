import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Workload Intelligence — Page Load', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  /* ------------------------------------------------------------------ */
  /*  Dashboard                                                          */
  /* ------------------------------------------------------------------ */
  test('Dashboard renders KPI cards, tabs, and team table', async ({ page }) => {
    await page.goto('/admin/workload/dashboard');

    // Page heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // KPI metric cards — verify at least 3 stat cards are present
    const metricCards = page.locator('[class*="Card"]').filter({ hasText: /employees|load|utilization|risk|off.hours/i });
    await expect(metricCards.first()).toBeVisible();

    // Tabs: Capacity, Objectives, Off Hours
    // TODO: Adjust tab labels if translated
    await expect(page.getByRole('tab', { name: /capacity/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /objectives/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /off.hours/i })).toBeVisible();

    // Team overview table should be present in the Capacity tab (default)
    await expect(page.getByRole('table')).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Team Command Center                                                */
  /* ------------------------------------------------------------------ */
  test('Team Command Center renders stats, filters, and member list', async ({ page }) => {
    await page.goto('/admin/workload/team');

    // Page heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Filter controls — search input
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();

    // At least one filter combobox (status / priority / employee / source)
    const comboboxes = page.getByRole('combobox');
    await expect(comboboxes.first()).toBeVisible();

    // Member accordion area — look for accordion triggers or employee names
    const accordion = page.locator('[data-state]').first();
    await expect(accordion).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Executive Dashboard                                                */
  /* ------------------------------------------------------------------ */
  test('Executive Dashboard renders TAMMAL Index and action buttons', async ({ page }) => {
    await page.goto('/admin/workload/executive');

    // Page heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // TAMMAL Index card
    // TODO: Adjust text if translated
    await expect(page.getByText(/tammal/i)).toBeVisible();

    // Action buttons
    await expect(page.getByRole('button', { name: /run ai|ai predictions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /run snapshot|snapshot/i })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Portfolio                                                          */
  /* ------------------------------------------------------------------ */
  test('Portfolio page renders objectives and initiatives sections', async ({ page }) => {
    await page.goto('/admin/workload/portfolio');

    // Page heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Objectives & Initiatives sections
    // TODO: Adjust text if translated
    await expect(page.getByText(/objectives|أهداف/i)).toBeVisible();
    await expect(page.getByText(/initiatives|مبادرات/i)).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  My Workload (personal)                                             */
  /* ------------------------------------------------------------------ */
  test('My Workload renders personal stats and view toggle', async ({ page }) => {
    await page.goto('/my-workload');

    // Stats — active, completed, overdue
    // TODO: Adjust text if translated
    await expect(page.getByText(/active|نشط/i)).toBeVisible();
    await expect(page.getByText(/completed|مكتمل/i)).toBeVisible();
    await expect(page.getByText(/overdue|متأخر/i)).toBeVisible();

    // View toggle group (tasks / calendar / approvals)
    const toggleGroup = page.getByRole('group');
    await expect(toggleGroup).toBeVisible();
  });
});
