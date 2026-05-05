import { test, expect } from '@playwright/test';

test.describe('API Routes — Security & Validation', () => {
  test('leads POST rejects empty body', async ({ request }) => {
    const response = await request.post('/api/leads', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    // Should get 400 (validation) or 401 (unauthorized)
    expect([400, 401]).toContain(response.status());
  });

  test('leads POST rejects invalid input', async ({ request }) => {
    const response = await request.post('/api/leads', {
      data: { title: '' }, // empty title should be rejected by Zod
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('leads GET without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/leads');
    expect(response.status()).toBe(401);
  });

  test('email POST rejects missing required fields', async ({ request }) => {
    const response = await request.post('/api/email', {
      data: { to: 'test@example.com' }, // missing subject and body
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
  });

  test('generate-email POST rejects missing purpose', async ({ request }) => {
    const response = await request.post('/api/generate-email', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
  });

  test('stripe webhook rejects unsigned requests', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      data: '{}',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(response.status()).toBe(400);
  });

  test('cron followup rejects unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/cron/followup');
    expect(response.status()).toBe(401);
  });

  test('cron followup rejects wrong bearer token', async ({ request }) => {
    const response = await request.get('/api/cron/followup', {
      headers: { 'Authorization': 'Bearer wrong_token' },
    });
    expect(response.status()).toBe(401);
  });

  test('usage GET without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/usage');
    expect(response.status()).toBe(401);
  });

  test('export GET without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/export?mode=job');
    expect(response.status()).toBe(401);
  });

  test('analytics GET without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/analytics');
    expect(response.status()).toBe(401);
  });

  test('jobs POST requires query parameter', async ({ request }) => {
    const response = await request.post('/api/jobs', {
      data: { query: '' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
  });
});
