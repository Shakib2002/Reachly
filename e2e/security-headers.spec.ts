import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
  test('response includes security headers', async ({ page }) => {
    const response = await page.goto('/login');
    if (!response) throw new Error('No response');

    const headers = response.headers();

    // X-Frame-Options — prevents clickjacking
    expect(headers['x-frame-options']).toBe('DENY');

    // X-Content-Type-Options — prevents MIME sniffing
    expect(headers['x-content-type-options']).toBe('nosniff');

    // Referrer-Policy
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // X-XSS-Protection
    expect(headers['x-xss-protection']).toBe('1; mode=block');

    // HSTS
    expect(headers['strict-transport-security']).toContain('max-age=');

    // CSP exists
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
  });
});

test.describe('Page Navigation', () => {
  test('login page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('register page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('login page has proper meta tags', async ({ page }) => {
    await page.goto('/login');
    // Should have a title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('login page is usable on mobile', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    // Input should fit within viewport
    const box = await emailInput.boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(360);
    }
  });
});
