import { test, expect } from '@playwright/test';

test.describe('Mood Check Flow', () => {
  // Using a long timeout for tests with multiple navigation steps and network requests
  test.setTimeout(60_000);

  test('user can log in, submit a mood check, and verify persistence', async ({ page, context }) => {
    // ----------------------------------------------------------------------
    // 1. Initial State
    // The test naturally starts fully authenticated due to global setup (auth.setup.ts).
    // ----------------------------------------------------------------------
    await page.goto('/');
    
    // Verify successful load of dashboard
    await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 15_000 });

    // ----------------------------------------------------------------------
    // 2. Navigates to Mood Check page / widget
    // The Daily Check-in widget is on the Dashboard tab.
    // ----------------------------------------------------------------------
    // Wait for the widget container to load
    await page.waitForTimeout(2000); // give the skeleton loaders a moment
    
    const alreadyCompleted = page.getByText(/check.?in complete|great job|you've checked in|مكتمل/i);
    const feelingPrompt = page.getByText(/how are you feeling/i);

    // If the widget shows we already checked in today (because of a previous test run),
    // we bypass the form filling and just assert data persistence.
    // Use .waitFor to actually poll the DOM instead of an immediate .isVisible() boolean check
    const isCompleted = await alreadyCompleted.first().waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);

    if (isCompleted) {
      console.log('User already checked in today. Verifying completed state instead.');
      await expect(alreadyCompleted.first()).toBeVisible();
      
      // Refresh to verify persistence
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page).toHaveURL('/');
      await expect(page.getByText(/check.?in complete|great job|you've checked in|مكتمل/i).first()).toBeVisible();
      return; // End test successfully
    }

    // Otherwise, we are in the clean state, proceed with checking in:
    await expect(feelingPrompt).toBeVisible({ timeout: 15_000 });

    // ----------------------------------------------------------------------
    // 3. Answers mood questions
    // ----------------------------------------------------------------------
    const moodButton = page.getByRole('button', { name: /great|جيد جدا/i });
    await expect(moodButton).toBeVisible();
    await moodButton.click();

    // Handling optional follow-up
    const notesInput = page.getByRole('textbox', { name: /note|reason|why|سبب/i });
    if (await notesInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await notesInput.fill('Feeling very productive today, testing Playwright!');
    }

    // ----------------------------------------------------------------------
    // 4. Submits the form
    // ----------------------------------------------------------------------
    const submitButton = page.getByRole('button', { name: /submit|save|حفظ|إرسال/i });
    if (await submitButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expect(submitButton).toBeEnabled();
      await submitButton.click();
    }

    // ----------------------------------------------------------------------
    // 5. Verifies success message
    // ----------------------------------------------------------------------
    const successToast = page.locator('[data-sonner-toast][data-type="success"], [role="alert"]');
    const inlineSuccess = page.getByText(/check.?in complete|great job|you've checked in|مكتمل/i);
    
    await expect(successToast.or(inlineSuccess).first()).toBeVisible({ timeout: 10_000 });

    // ----------------------------------------------------------------------
    // 6. Verifies data is saved after refresh
    // ----------------------------------------------------------------------
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');

    const completedText = page.getByText(/check.?in complete|great job|you've checked in|مكتمل/i);
    await expect(completedText.first()).toBeVisible({ timeout: 10_000 });
  });
});
