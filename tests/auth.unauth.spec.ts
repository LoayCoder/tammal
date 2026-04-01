import { test, expect } from '@playwright/test';

/**
 * Auth page tests – run WITHOUT stored session (unauthenticated project).
 * Uses fresh context with no cookies/storage to simulate a new visitor.
 */
test.describe('Auth Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    // Wait for the auth card to fully render
    await page.waitForLoadState('networkidle');
  });

  test('renders login form with email and password fields', async ({ page }) => {
    // Title assertion
    await expect(page).toHaveTitle(/tammal/i);

    // Form fields – use both languages
    const emailField = page.getByLabel(/email|البريد الإلكتروني/i);
    const passwordField = page.getByLabel(/^password$|كلمة المرور/i);
    const submitBtn = page.getByRole('button', { name: /login|تسجيل الدخول/i });

    await expect(emailField).toBeVisible();
    await expect(emailField).toBeEditable();
    await expect(passwordField).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test('shows validation errors for empty submit', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /login|تسجيل الدخول/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Browser-native validation should block or app-level validation shows errors
    // Check that we're still on /auth (no redirect happened)
    await expect(page).toHaveURL(/\/auth/);
  });

  test('shows validation error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email|البريد الإلكتروني/i).fill('not-an-email');
    await page.getByLabel(/^password$|كلمة المرور/i).fill('password123');
    await page.getByRole('button', { name: /login|تسجيل الدخول/i }).click();

    // Should stay on auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.getByLabel(/email|البريد الإلكتروني/i).fill('wrong@example.com');
    await page.getByLabel(/^password$|كلمة المرور/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login|تسجيل الدخول/i }).click();

    // Wait for toast error or inline error
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    const errorText = page.locator('.text-destructive');
    await expect(errorToast.or(errorText).first()).toBeVisible({ timeout: 10_000 });
  });

  test('has language selector and theme toggle', async ({ page }) => {
    await expect(page.getByLabel(/select language|اختيار اللغة/i)).toBeVisible();
    await expect(page.getByLabel(/toggle theme|تبديل المظهر/i)).toBeVisible();
  });

  test('unauthenticated user is redirected to /auth from protected routes', async ({ page }) => {
    // Clear all storage to simulate unauthenticated state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('/');
    
    // Wait for the auth redirect (SPA routing may take a moment)
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });
});
