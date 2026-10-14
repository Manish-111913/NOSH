import { expect, test } from '@playwright/test';
import { API_URL, openDashboard, resetDatabase, row } from './helpers.js';

test.beforeEach(() => resetDatabase());

test('shows the seeded dishes and metrics from the API', async ({ page }) => {
  await openDashboard(page);

  for (const name of ['Jeera Rice', 'Paneer Tikka', 'Rabdi', 'Chicken Biryani', 'Alfredo Pasta']) {
    await expect(page.getByRole('cell', { name })).toBeVisible();
  }
  await expect(page.getByTestId('metric-total')).toHaveText('5');
  await expect(page.getByTestId('metric-published')).toHaveText('5');
  await expect(page.getByTestId('metric-unpublished')).toHaveText('0');
  await expect(row(page, '1')).toContainText('v1');
  await expect(row(page, '1')).toContainText('Published');
});

test('search and status filter work on the loaded data', async ({ page }) => {
  await openDashboard(page);

  await page.getByLabel('Search dishes').fill('paneer');
  await expect(page.getByTestId('results-summary')).toHaveText('Showing 1–1 of 1 dishes');

  await page.getByLabel('Search dishes').fill('zzz');
  await expect(page.getByText('No matching dishes')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();

  await page.getByLabel('Filter by publication status').selectOption('UNPUBLISHED');
  await expect(page.getByText('No matching dishes')).toBeVisible();
});

test('shows the empty state when the API returns no dishes', async ({ page }) => {
  await page.route(`${API_URL}/dishes`, (route) => route.fulfill({ json: [] }));
  await page.goto('/');
  await expect(page.getByText('No dishes available')).toBeVisible();
  await expect(page.getByTestId('metric-total')).toHaveText('0');
});

test('shows an error state when the backend is unreachable, then recovers on retry', async ({ page }) => {
  await page.route(`${API_URL}/dishes`, (route) => route.abort('connectionrefused'));
  await page.goto('/');

  await expect(page.getByText('Unable to load dishes. Check your connection and try again.')).toBeVisible();
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected');
  await expect(page.getByTestId('metric-total')).toHaveText('—');

  await page.unroute(`${API_URL}/dishes`);
  await page.getByRole('button', { name: 'Retry request' }).click();

  await expect(row(page, '1')).toBeVisible();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');
});

test('shows a broken-image fallback for images that fail to load', async ({ page }) => {
  await page.route(`${API_URL}/dishes`, async (route) => {
    const dishes = await (await route.fetch()).json();
    dishes[0].imageUrl = 'https://nosh-assignment.s3.ap-south-1.amazonaws.com/does-not-exist.jpg';
    await route.fulfill({ json: dishes });
  });
  await page.goto('/');

  await expect(row(page, '1').locator('img')).toHaveCount(0);
  await expect(row(page, '2').locator('img')).toHaveCount(1);
});

test('mobile layout has no horizontal page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDashboard(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
