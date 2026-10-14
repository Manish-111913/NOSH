import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

export const API_URL = 'http://localhost:4730';
export const APP_URL = 'http://localhost:5730';
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL || 'postgresql://nosh:nosh_local_password@localhost:54329/nosh_e2e';

const BACKEND_DIR = fileURLToPath(new URL('../../backend/', import.meta.url));

/** Restores the e2e database to the original seed data (all dishes back to version 1). */
export function resetDatabase() {
  if (!new URL(E2E_DATABASE_URL).pathname.endsWith('_e2e')) {
    throw new Error('E2E_DATABASE_URL must point to a database whose name ends with "_e2e".');
  }
  execFileSync(process.execPath, ['scripts/reset.js', '--yes'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: E2E_DATABASE_URL },
    stdio: 'pipe',
  });
}

/** Reads a dish directly from the API (what is actually saved). */
export async function getSavedDish(request, dishId) {
  const res = await request.get(`${API_URL}/dishes/${dishId}`);
  expect(res.ok()).toBeTruthy();
  return res.json();
}

/** Saves a change through the API, as another client would. */
export async function patchDishViaApi(request, dishId, body) {
  const res = await request.patch(`${API_URL}/dishes/${dishId}`, { data: body });
  expect(res.status()).toBe(200);
  return res.json();
}

// ---- Page helpers ----

export const drawer = (page) => page.getByRole('complementary', { name: 'Dish Edit Drawer' });
export const nameInput = (page) => page.locator('#drawerDishNameInput');
export const row = (page, dishId) => page.getByTestId(`dish-row-${dishId}`);

export async function openDashboard(page) {
  await page.goto('/');
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');
}

export async function openEditor(page, dishId) {
  await row(page, dishId).getByRole('button', { name: /^Edit/ }).click();
  await expect(drawer(page)).toBeVisible();
}

export const publicationRadio = (page, label) => drawer(page).getByRole('radio', { name: new RegExp(`^${label}`) });
export const saveButton = (page) => drawer(page).getByRole('button', { name: /Save changes|Saving/ });
