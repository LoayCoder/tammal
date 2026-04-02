import { Page, expect } from '@playwright/test';

/**
 * A helper to log in with a specific role, useful when global auth is insufficient.
 * 
 * TODO: Verify login form selectors:
 * - Email input: getByLabel(/email/i) - confirm exact label
 * - Password input: getByLabel(/password/i) - confirm exact label
 * - Submit button: getByRole('button', { name: /log\s?in/i }) - confirm exact text
 */
export async function loginAsRole(page: Page, role: 'admin' | 'manager' | 'employee') {
  await page.goto('/auth');
  
  // Credentials for testing
  const credentials = {
    admin: { email: 'Luay@dhuud.com', password: 'Dhuud@2026!' },
    manager: { email: 'Luay@dhuud.com', password: 'Dhuud@2026!' },
    employee: { email: 'test@example.com', password: 'password123' },
  };

  await expect(page.getByLabel(/email/i)).toBeVisible();
  await page.getByLabel(/email/i).fill(credentials[role].email);
  await page.getByLabel(/password/i).first().fill(credentials[role].password);
  
  await page.getByRole('button', { name: /log\s?in|sign\s?in|دخول/i }).click();
  // Wait for redirect to complete
  await page.waitForURL('/', { timeout: 15_000 });
}

/**
 * A helper to navigate to the Workload Intelligence page.
 * 
 * TODO: Verify route and heading:
 * - Route: /admin/workload/team (Team Command Center)
 * - Alternative routes: /admin/workload/dashboard, /admin/workload/representative
 * - Heading: getByRole('heading', { name: /Team Command Center/i })
 */
export async function navigateToWorkloadIntelligence(page: Page) {
  // Navigate directly to the Team Workload dashboard
  await page.goto('/admin/workload/team');
  // Wait for the main identifier to be visible
  await expect(page.getByRole('heading', { name: /Team Command Center|Workload|Command Center/i, level: 1 })).toBeVisible({ timeout: 15_000 });
}
