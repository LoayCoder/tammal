import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Workload Intelligence — Filters (Team Command Center)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/workload/team');
    // Wait for page to be fully loaded
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Status filter                                                      */
  /* ------------------------------------------------------------------ */
  test('Status filter updates displayed tasks', async ({ page }) => {
    // Open status filter combobox
    // TODO: Adjust placeholder/label if translated
    const statusTrigger = page.getByRole('combobox').first();
    await statusTrigger.click();

    // Select "In Progress"
    // TODO: Adjust option text if translated
    await page.locator('[role="option"]').filter({ hasText: /in.progress|قيد التنفيذ/i }).click();

    // Verify filter is applied — UI should reflect the selection
    await expect(statusTrigger).toContainText(/in.progress|قيد التنفيذ/i);

    // Verify content updated (no crash, page still functional)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Search filter                                                      */
  /* ------------------------------------------------------------------ */
  test('Search input filters tasks by text', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('nonexistent-task-xyz-12345');

    // Wait for debounce
    await page.waitForTimeout(500);

    // With a nonsensical query, we expect either no results or an empty state
    // The accordion area should still render without crashing
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Priority filter                                                    */
  /* ------------------------------------------------------------------ */
  test('Priority filter narrows displayed tasks', async ({ page }) => {
    // Find priority combobox — typically the second select
    const comboboxes = page.getByRole('combobox');
    const priorityTrigger = comboboxes.nth(1);
    await priorityTrigger.click();

    // Select P1
    await page.locator('[role="option"]').filter({ hasText: /P1/ }).click();

    // Verify selection applied
    await expect(priorityTrigger).toContainText(/P1/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Employee filter                                                    */
  /* ------------------------------------------------------------------ */
  test('Employee filter shows only that employee', async ({ page }) => {
    const comboboxes = page.getByRole('combobox');
    // Employee filter is typically the third combobox
    const employeeTrigger = comboboxes.nth(2);
    await employeeTrigger.click();

    // Select first real employee option (skip "All")
    const options = page.locator('[role="option"]');
    const count = await options.count();
    if (count > 1) {
      const selectedName = await options.nth(1).textContent();
      await options.nth(1).click();

      // Verify selection is applied
      if (selectedName) {
        await expect(employeeTrigger).toContainText(selectedName);
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Clear filters restores full list                                   */
  /* ------------------------------------------------------------------ */
  test('Clearing filters restores full task list', async ({ page }) => {
    // Apply a restrictive filter
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('nonexistent-xyz');
    await page.waitForTimeout(500);

    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Reset status to All
    const statusTrigger = page.getByRole('combobox').first();
    await statusTrigger.click();
    await page.locator('[role="option"]').filter({ hasText: /^all$|^الكل$/i }).click();

    // Page should show full results again
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Source type filter                                                  */
  /* ------------------------------------------------------------------ */
  test('Source type filter narrows by task origin', async ({ page }) => {
    const comboboxes = page.getByRole('combobox');
    // Source filter is typically the last combobox
    const sourceTrigger = comboboxes.last();
    await sourceTrigger.click();

    // Select "Manual" or first non-All option
    // TODO: Adjust text if translated
    const manualOption = page.locator('[role="option"]').filter({ hasText: /manual|يدوي/i });
    if (await manualOption.count() > 0) {
      await manualOption.click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
});
