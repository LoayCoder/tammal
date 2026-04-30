import { test, expect } from '@playwright/test';

test.describe('Auth flows (UI integration)', () => {
  test('login and signup modes render and toggle', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByText(/auth\.loginTitle|login/i).first()).toBeVisible();

    await page.getByRole('button', { name: /auth\.signup|sign up/i }).click();
    await expect(page.getByLabel(/confirm password|auth\.confirmPassword/i)).toBeVisible();

    await page.getByRole('button', { name: /auth\.login|login/i }).click();
    await expect(page.getByLabel(/confirm password|auth\.confirmPassword/i)).toHaveCount(0);
  });

  test('client validation blocks invalid login payload', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/email|auth\.email/i).fill('bad-email');
    await page.getByLabel(/password|auth\.password/i).fill('123');
    await page.getByRole('button', { name: /auth\.login|login/i }).click();

    await expect(page.getByText(/validation\.invalidEmail|invalid email/i)).toBeVisible();
  });

  test('accept invite code flow keeps verify disabled for short code', async ({ page }) => {
    await page.goto('/auth/accept-invite');
    const verify = page.getByRole('button', { name: /verify|acceptInvite\.verifyCode/i });
    await expect(verify).toBeDisabled();
    await page.getByLabel(/code|invitations\.code/i).fill('ABC123');
    await expect(verify).toBeDisabled();
  });
});