import { test, expect } from '@playwright/test';
import { navigateToWorkloadIntelligence } from './helpers';

// TODO: Verify exact UI text labels for assertions below:
// - "Team Command Center" or "Workload Intelligence" heading
// - KPI card labels: "Team Size", "At Risk", etc.
// - Chart labels: "Workload Distribution" or Arabic equivalent
// These may need adjustment based on actual UI strings

test.describe('Workload Intelligence - Page Load', () => {
  // Use global authenticated state
  test.beforeEach(async ({ page }) => {
    await navigateToWorkloadIntelligence(page);
  });

  test('verifies page heading, cards, and tables render without errors', async ({ page }) => {
    // 1. Verify Page Heading
    // Adjust name pattern if heading text differs (e.g., Arabic)
    const heading = page.getByRole('heading', { name: /Team Command Center|Workload|Command Center/i, level: 1 });
    await expect(heading).toBeVisible();

    // 2. Verify Main KPI Summary Cards are visible
    // TODO: Verify exact card labels from UI - "Team Size", "At Risk" may vary
    await expect(page.getByText(/Team Size|حجم الفريق/i).first()).toBeVisible();
    await expect(page.getByText(/At Risk|معرض للخطر/i).first()).toBeVisible();

    // 3. Verify Charts render
    // Chart wrapper contains "Workload Distribution" text
    await expect(page.getByText(/Workload Distribution|توزيع عبء العمل/i)).toBeVisible();

    // 4. Verify Data filter/table elements are visible
    const searchInput = page.getByPlaceholder(/Search|بحث/i).first();
    await expect(searchInput).toBeVisible();

    // 5. Verify no crash or empty error state - check for absence of error alerts
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).not.toBeVisible();
  });
});
