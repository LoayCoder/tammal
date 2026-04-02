import { test, expect } from '@playwright/test';
import { loginAsRole, navigateToWorkloadIntelligence } from './helpers';

// Disable global auth by clearing the storage state for this suite,
// because we want to test specific user roles with fresh logins.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Workload Intelligence - Role Based Access', () => {
  
  test('Manager/Admin role can access and view workload data', async ({ page }) => {
    // 1. Login as Manager (or Admin)
    await loginAsRole(page, 'manager');

    // 2. Navigate to Workload Intelligence (/admin/workload/team)
    await navigateToWorkloadIntelligence(page);

    // 3. Verify normal access
    const mainHeading = page.getByRole('heading', { name: /Team Command Center|Workload/i, level: 1 });
    await expect(mainHeading).toBeVisible();
    
    // Ensure charts and summaries are visible for authorized user
    await expect(page.getByText(/Team Size/i).first()).toBeVisible();
  });

  test('Restricted Employee role cannot access organization workload views', async ({ page }) => {
    // 1. Login as standard Employee
    await loginAsRole(page, 'employee');

    // 2. Attempt to navigate directly to Workload Intelligence
    await page.goto('/admin/workload/team');

    // 3. Verify access is denied - either unauthorized message or redirected to home
    // Check for unauthorized/access denied text first
    const unauthorizedText = page.getByText(/unauthorized|access denied|not allowed/i);
    const hasUnauthorized = await unauthorizedText.count() > 0;

    // Check if redirected to dashboard (home page)
    const hasDashboard = await page.getByRole('tab').first().isVisible().catch(() => false);

    // Verify the Workload Intelligence view isn't showing
    const workloadHeading = page.getByRole('heading', { name: /Team Command Center/i, level: 1 });
    const hasWorkloadView = await workloadHeading.count() > 0;

    // Assert: either unauthorized message shown OR redirected away from workload page
    expect(hasUnauthorized || hasDashboard || !hasWorkloadView).toBe(true);
  });
});
