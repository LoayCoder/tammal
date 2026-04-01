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

  test.fixme('Restricted Employee role cannot access organization workload views', async ({ page }) => {
    // 1. Login as standard Employee
    await loginAsRole(page, 'employee');

    // 2. Attempt to navigate directly to Workload Intelligence
    await page.goto('/admin/workload/team');

    // 3. Verify access is denied 
    // Wait for either the unauthorized message or navigation back to home page
    const unauthorizedWarning = page.getByText(/unauthorized|access denied|not found/i);
    const dashboardTab = page.getByRole('tab').first(); // Represents dashboard redirect

    // Depending on your app, the user is either blocked by a boundary or redirected.
    await expect(unauthorizedWarning.or(dashboardTab).first()).toBeVisible({ timeout: 10_000 });

    // Verify the Workload Intelligence view isn't showing up
    await expect(page.getByRole('heading', { name: /Team Command Center/i, level: 1 })).not.toBeVisible();
  });
});
