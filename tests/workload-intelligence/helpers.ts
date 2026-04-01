import { Page, expect } from '@playwright/test';

/**
 * A helper to log in with a specific role, useful when global auth is insufficient.
 */
export async function loginAsRole(page: Page, role: 'admin' | 'manager' | 'employee') {
  await page.goto('/auth');
  
  // TODO: Replace with actual valid credentials for each role from .env
  const credentials = {
    admin: { email: process.env.TEST_USER_EMAIL || '', password: process.env.TEST_USER_PASSWORD || '' },
    manager: { email: process.env.TEST_USER_EMAIL || '', password: process.env.TEST_USER_PASSWORD || '' },
    employee: { email: 'employee@tammal.com', password: 'password' }, // Needs real restrictive user 
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
 */
export async function navigateToWorkloadIntelligence(page: Page) {
  // Navigate directly to the Team Workload dashboard
  await page.goto('/admin/workload/team');
  // Wait for the main identifier to be visible
  await expect(page.getByRole('heading', { name: /Team Command Center/i, level: 1 })).toBeVisible({ timeout: 15_000 });
}
