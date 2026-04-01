import { test, expect } from '@playwright/test';

/**
 * Mental Health toolkit pages — verifies each sub-page loads and renders content.
 * Uses heading role or visible text to avoid hidden responsive elements.
 */
test.describe('Mental Toolkit – Hub Page', () => {
  test('loads the mental toolkit hub', async ({ page }) => {
    await page.goto('/mental-toolkit');
    await page.waitForLoadState('networkidle');

    // The page should show some content (heading, cards, etc.)
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);
    // Verify we stayed on the correct URL (no redirect to error)
    await expect(page).toHaveURL(/\/mental-toolkit/);
  });
});

test.describe('Mental Toolkit – Breathing Page', () => {
  test('loads breathing exercises page', async ({ page }) => {
    await page.goto('/mental-toolkit/breathing');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/mental-toolkit\/breathing/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    // Look for visible content related to breathing
    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/breath|grounding|تنفس|exercise/i);
  });
});

test.describe('Mental Toolkit – Journaling Page', () => {
  test('loads journaling page', async ({ page }) => {
    await page.goto('/mental-toolkit/journaling');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/mental-toolkit\/journaling/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/journal|يوميات|prompt|reflect/i);
  });
});

test.describe('Mental Toolkit – Thought Reframer', () => {
  test('loads thought reframer page', async ({ page }) => {
    await page.goto('/mental-toolkit/thought-reframer');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/mental-toolkit\/thought-reframer/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/reframe|thought|إعادة|cognitive/i);
  });
});

test.describe('Mental Toolkit – Habits Page', () => {
  test('loads habits planner page', async ({ page }) => {
    await page.goto('/mental-toolkit/habits');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/mental-toolkit\/habits/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/habit|عادات|track|routine/i);
  });
});

test.describe('Mental Toolkit – Assessment Page', () => {
  test('loads self-assessment page', async ({ page }) => {
    await page.goto('/mental-toolkit/assessment');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/mental-toolkit\/assessment/);
    await expect(page.locator('body')).not.toContainText(/unexpected error/i);

    const pageContent = await page.locator('main, [role="main"], .container, body').first().textContent();
    expect(pageContent?.toLowerCase()).toMatch(/assessment|quiz|تقييم|self|wellbeing/i);
  });
});
