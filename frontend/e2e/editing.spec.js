import { expect, test } from '@playwright/test';
import {
  API_URL,
  drawer,
  getSavedDish,
  nameInput,
  openDashboard,
  openEditor,
  publicationRadio,
  resetDatabase,
  row,
  saveButton,
} from './helpers.js';

test.beforeEach(() => resetDatabase());

test('edits stay a local draft until Save; Discard restores the saved values', async ({ page, request }) => {
  await openDashboard(page);
  await openEditor(page, '2');

  await nameInput(page).fill('Paneer Tikka Draft');
  await expect(drawer(page).getByText('Unsaved changes')).toBeVisible();

  // Close the editor: the draft is kept and nothing reached the database.
  await drawer(page).getByRole('button', { name: 'Close', exact: true }).click();
  await expect(row(page, '2')).toContainText('Unsaved local draft');
  expect(await getSavedDish(request, '2')).toMatchObject({ dishName: 'Paneer Tikka', version: 1 });

  // The draft survives a page refresh (sessionStorage).
  await page.reload();
  await expect(row(page, '2')).toContainText('Unsaved local draft');
  await openEditor(page, '2');
  await expect(nameInput(page)).toHaveValue('Paneer Tikka Draft');

  // Discard restores the last loaded values.
  await drawer(page).getByRole('button', { name: 'Discard' }).click();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(row(page, '2')).not.toContainText('Unsaved local draft');
  await openEditor(page, '2');
  await expect(nameInput(page)).toHaveValue('Paneer Tikka');
  expect(await getSavedDish(request, '2')).toMatchObject({ dishName: 'Paneer Tikka', version: 1 });
});

test('a successful save shows the saved values and version and persists after refresh', async ({ page, request }) => {
  await openDashboard(page);
  await openEditor(page, '3');

  await nameInput(page).fill('  Rabdi Special  ');
  await publicationRadio(page, 'Unpublished').check();
  await saveButton(page).click();

  await expect(page.getByText('Dish updated successfully (v2): "Rabdi Special"')).toBeVisible();
  await expect(row(page, '3')).toContainText('Rabdi Special');
  await expect(row(page, '3')).toContainText('v2');
  await expect(row(page, '3')).toContainText('Unpublished');
  await expect(row(page, '3')).not.toContainText('Unsaved local draft');
  await expect(page.getByTestId('metric-unpublished')).toHaveText('1');

  expect(await getSavedDish(request, '3')).toMatchObject({ dishName: 'Rabdi Special', isPublished: false, version: 2 });

  await page.reload();
  await expect(row(page, '3')).toContainText('Rabdi Special');
  await expect(row(page, '3')).toContainText('v2');
});

test('publishing with an empty name is blocked; unpublished with an empty name is allowed', async ({ page }) => {
  await openDashboard(page);
  await openEditor(page, '1');

  await nameInput(page).fill('   ');
  await expect(drawer(page).getByText('A published dish must have a non-empty name.')).toBeVisible();
  await expect(saveButton(page)).toBeDisabled();

  await publicationRadio(page, 'Unpublished').check();
  await expect(drawer(page).getByText('A published dish must have a non-empty name.')).toHaveCount(0);
  await expect(saveButton(page)).toBeEnabled();
});

test('publishing a dish with an invalid image URL is blocked', async ({ page }) => {
  // Serve dish 5 with an unsupported URL scheme to exercise the UI rule.
  await page.route(`${API_URL}/dishes`, async (route) => {
    const dishes = await (await route.fetch()).json();
    const dish = dishes.find((d) => d.dishId === '5');
    dish.imageUrl = 'ftp://example.com/alfredo.jpg';
    dish.isPublished = false;
    await route.fulfill({ json: dishes });
  });
  await openDashboard(page);
  await openEditor(page, '5');

  await publicationRadio(page, 'Published').check();
  await expect(drawer(page).getByText('Image URL Validation Error')).toBeVisible();
  await expect(saveButton(page)).toBeDisabled();
});

test('a server validation error (400) keeps the draft and shows the message', async ({ page }) => {
  await page.route(`${API_URL}/dishes/1`, (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 400,
          json: { error: { code: 'INVALID_IMAGE_URL', message: 'This dish cannot be published because its image URL is not a valid HTTP or HTTPS URL.' } },
        })
      : route.fallback()
  );
  await openDashboard(page);
  await openEditor(page, '1');
  await nameInput(page).fill('Jeera Rice v2');
  await saveButton(page).click();

  await expect(drawer(page).getByText('The server rejected these changes.')).toBeVisible();
  await expect(drawer(page).getByText(/image URL is not a valid HTTP or HTTPS URL/)).toBeVisible();
  await expect(nameInput(page)).toHaveValue('Jeera Rice v2');
});

test('an unknown dish (404) on save shows the not-found state', async ({ page }) => {
  await page.route(`${API_URL}/dishes/2`, (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({ status: 404, json: { error: { code: 'DISH_NOT_FOUND', message: 'Dish "2" was not found.' } } })
      : route.fallback()
  );
  await openDashboard(page);
  await openEditor(page, '2');
  await nameInput(page).fill('Ghost dish');
  await saveButton(page).click();

  await expect(drawer(page).getByRole('heading', { name: 'This dish could not be found' })).toBeVisible();
});
