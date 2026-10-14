import { expect, test } from '@playwright/test';
import {
  API_URL,
  drawer,
  getSavedDish,
  nameInput,
  openDashboard,
  openEditor,
  patchDishViaApi,
  resetDatabase,
  row,
  saveButton,
} from './helpers.js';

test.beforeEach(() => resetDatabase());

const conflictDialog = (page) => page.getByRole('dialog').filter({ hasText: 'Latest saved version' });

test('two tabs: the stale tab gets a 409, keeps its draft, and only loses it on explicit reload', async ({ context, request }) => {
  const tabA = await context.newPage();
  const tabB = await context.newPage();
  await openDashboard(tabA);
  await openDashboard(tabB);

  // Both tabs start editing dish 4 at version 1.
  await openEditor(tabB, '4');
  await nameInput(tabB).fill('Biryani from tab B');
  await openEditor(tabA, '4');
  await nameInput(tabA).fill('Biryani from tab A');

  // Tab A saves first.
  await saveButton(tabA).click();
  await expect(tabA.getByText('Dish updated successfully (v2): "Biryani from tab A"')).toBeVisible();

  // Tab B saves its stale draft -> conflict.
  await saveButton(tabB).click();
  const dialog = conflictDialog(tabB);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('HTTP 409 Conflict')).toBeVisible();
  await expect(dialog.getByText('expected: v1')).toBeVisible();
  await expect(dialog.getByText('Server: v2')).toBeVisible();
  await expect(dialog.getByText('Biryani from tab A')).toBeVisible();
  await expect(dialog.getByText('Biryani from tab B')).toBeVisible();

  // Tab A's update is intact.
  expect(await getSavedDish(request, '4')).toMatchObject({ dishName: 'Biryani from tab A', version: 2 });

  // Keep the draft: still there, and saving again still conflicts (no silent overwrite or auto-retry).
  await dialog.getByRole('button', { name: 'Keep my draft' }).click();
  await expect(dialog).toBeHidden();
  await expect(nameInput(tabB)).toHaveValue('Biryani from tab B');
  await saveButton(tabB).click();
  await expect(dialog).toBeVisible();
  expect(await getSavedDish(request, '4')).toMatchObject({ dishName: 'Biryani from tab A', version: 2 });

  // Explicit reload with confirmation replaces the draft with the latest saved data.
  await dialog.getByRole('button', { name: 'Reload latest version' }).click();
  await dialog.getByRole('button', { name: 'Yes, discard draft & reload' }).click();
  await expect(dialog).toBeHidden();
  await expect(nameInput(tabB)).toHaveValue('Biryani from tab A');
  await expect(drawer(tabB).getByText('Saved on server')).toBeVisible();
  await expect(row(tabB, '4')).not.toContainText('Unsaved local draft');
});

test('a failed reload after a conflict keeps the draft', async ({ page, request }) => {
  await openDashboard(page);
  await openEditor(page, '5');
  await nameInput(page).fill('My Alfredo');
  await patchDishViaApi(request, '5', { dishName: 'Alfredo (saved elsewhere)', isPublished: true, expectedVersion: 1 });

  await saveButton(page).click();
  const dialog = conflictDialog(page);
  await expect(dialog).toBeVisible();

  await page.route(`${API_URL}/dishes/5`, (route) => route.abort('connectionrefused'));
  await dialog.getByRole('button', { name: 'Reload latest version' }).click();
  await dialog.getByRole('button', { name: 'Yes, discard draft & reload' }).click();
  await expect(dialog.getByText(/Could not load the latest version/)).toBeVisible();

  await dialog.getByRole('button', { name: 'Keep my draft' }).click();
  await expect(nameInput(page)).toHaveValue('My Alfredo');
});

test('a failed save (backend unavailable) keeps the draft editable and can be retried', async ({ page, request }) => {
  await openDashboard(page);
  await openEditor(page, '2');
  await nameInput(page).fill('Paneer Tikka Offline');

  await page.route(`${API_URL}/dishes/2`, (route) => (route.request().method() === 'PATCH' ? route.abort('connectionrefused') : route.fallback()));
  await saveButton(page).click();

  await expect(drawer(page).getByText('Unable to save changes. Check connection and retry.')).toBeVisible();
  await expect(nameInput(page)).toHaveValue('Paneer Tikka Offline');
  await expect(nameInput(page)).toBeEditable();
  await expect(drawer(page).getByText('Unsaved changes')).toBeVisible();
  expect(await getSavedDish(request, '2')).toMatchObject({ dishName: 'Paneer Tikka', version: 1 });

  // Backend is back: retry succeeds.
  await page.unroute(`${API_URL}/dishes/2`);
  await drawer(page).getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('Dish updated successfully (v2): "Paneer Tikka Offline"')).toBeVisible();
  expect(await getSavedDish(request, '2')).toMatchObject({ dishName: 'Paneer Tikka Offline', version: 2 });
});

test('a server error (500) keeps the draft and shows the error', async ({ page, request }) => {
  await page.route(`${API_URL}/dishes/3`, (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server.' } } })
      : route.fallback()
  );
  await openDashboard(page);
  await openEditor(page, '3');
  await nameInput(page).fill('Rabdi 500');
  await saveButton(page).click();

  await expect(drawer(page).getByText('Something went wrong on the server.', { exact: false })).toBeVisible();
  await expect(nameInput(page)).toHaveValue('Rabdi 500');
  expect(await getSavedDish(request, '3')).toMatchObject({ dishName: 'Rabdi', version: 1 });
});

test('changes saved by another API client appear automatically; an open draft is preserved', async ({ page, request }) => {
  await openDashboard(page);

  // No draft for dish 5: the new saved value simply appears (polling, <= 5 s).
  await patchDishViaApi(request, '5', { dishName: 'Alfredo (API update)', isPublished: false, expectedVersion: 1 });
  await expect(row(page, '5')).toContainText('Alfredo (API update)', { timeout: 8_000 });
  await expect(row(page, '5')).toContainText('v2');

  // Draft for dish 1: the draft is never replaced; the user is told newer data exists.
  await openEditor(page, '1');
  await nameInput(page).fill('Jeera Rice (my draft)');
  await patchDishViaApi(request, '1', { dishName: 'Jeera Rice (API update)', isPublished: true, expectedVersion: 1 });

  await expect(drawer(page).getByText('A newer saved version (v2) is available on server.')).toBeVisible({ timeout: 8_000 });
  await expect(nameInput(page)).toHaveValue('Jeera Rice (my draft)');
  await expect(row(page, '1')).toContainText('newer version saved on server');
});
