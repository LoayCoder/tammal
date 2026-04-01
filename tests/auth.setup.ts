import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authFile = join(__dirname, '.auth', 'user.json');

/**
 * Authenticates once and saves session state for all subsequent tests.
 * Runs as a dependency before any authenticated test project.
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.test. ' +
      'Please set valid credentials before running tests.'
    );
  }

  // Navigate to auth page
  await page.goto('/auth');

  // Wait for the login form to be ready
  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10_000 });

  // Fill credentials
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);

  // Submit
  await page.getByRole('button', { name: /log\s?in|sign\s?in|دخول/i }).click();

  // Wait for successful redirect to dashboard
  await page.waitForURL('/', { timeout: 30_000 });

  // Verify we're actually on the dashboard (tabs should be visible)
  await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 10_000 });

  // Persist session
  await page.context().storageState({ path: authFile });
});
