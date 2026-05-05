import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1, h2')).toContainText(/sign in|log in|welcome/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Wait for error toast or error message
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('[role="status"], .text-red-500, [class*="error"]').count();
    expect(errorVisible).toBeGreaterThan(0);
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1, h2')).toContainText(/sign up|register|create/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('unauthenticated user is redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user is redirected from CRM to login', async ({ page }) => {
    await page.goto('/crm');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user is redirected from discover to login', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });
});
