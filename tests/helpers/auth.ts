import { type Page, expect } from '@playwright/test';

/**
 * Role-to-credential map.
 * TODO: Replace with real test-account credentials for each role.
 */
const CREDENTIALS: Record<string, { email: string; password: string }> = {
  admin: {
    email: 'admin@test.tammal.com',       // TODO: real admin email
    password: 'TestAdmin123!',             // TODO: real admin password
  },
  manager: {
    email: 'manager@test.tammal.com',      // TODO: real manager email
    password: 'TestManager123!',           // TODO: real manager password
  },
  user: {
    email: 'user@test.tammal.com',         // TODO: real regular-user email
    password: 'TestUser123!',              // TODO: real regular-user password
  },
};

/**
 * Log in as the given role via the /auth page.
 * Waits until navigation leaves the auth page.
 */
export async function loginAs(page: Page, role: 'admin' | 'manager' | 'user') {
  const creds = CREDENTIALS[role];
  if (!creds) throw new Error(`Unknown role: ${role}`);

  await page.goto('/auth');

  // Fill login form
  await page.getByPlaceholder(/email/i).fill(creds.email);
  await page.getByPlaceholder(/password/i).fill(creds.password);

  // Submit
  await page.getByRole('button', { name: /sign in|login|تسجيل الدخول/i }).click();

  // Wait for redirect away from /auth
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15_000 });
}
