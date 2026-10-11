const { test, expect } = require('@playwright/test');

async function login(page) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill('peter@abv.bg');
  await page.locator('input[name="password"]').fill('123456');

  await Promise.all([
    page.waitForURL('**/catalog'),
    page.locator('input[type="submit"]').click()
  ]);
}

async function createBook(page, title) {
  await page.goto('/create');
  await page.locator('#title').fill(title);
  await page.locator('#description').fill('This is a test book description');
  await page.locator('#image').fill('https://example.com/book-image.jpg');
  await page.locator('#type').selectOption('Fiction');

  await Promise.all([
    page.waitForURL('**/catalog'),
    page.locator('#create-form input[type="submit"]').click()
  ]);
}

function uniqueBookTitle() {
  return `Test Book ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test('Verify "All Books" link is visible', async ({ page }) => {
  await page.goto('/catalog');

  await expect(page.locator('nav.navbar a[href="/catalog"]')).toBeVisible();
});

test('Verify "Login" button is visible', async ({ page }) => {
  await page.goto('/catalog');

  await expect(page.locator('nav.navbar a[href="/login"]')).toBeVisible();
});

test('Verify "All Books" link is visible after user login', async ({ page }) => {
  await login(page);

  await expect(page.locator('nav.navbar a[href="/catalog"]')).toBeVisible();
});

test('Login with valid credentials', async ({ page }) => {
  await login(page);

  await expect(page).toHaveURL(/\/catalog$/);
});

test('Login with empty input fields', async ({ page }) => {
  await page.goto('/login');

  const dialogPromise = page.waitForEvent('dialog');
  const clickPromise = page.locator('input[type="submit"]').click();
  const dialog = await dialogPromise;

  expect(dialog.type()).toBe('alert');
  expect(dialog.message()).toBe('All fields are required!');
  await dialog.accept();
  await clickPromise;

  await expect(page).toHaveURL(/\/login$/);
});

test('Add book with correct data', async ({ page }) => {
  await login(page);
  const title = uniqueBookTitle();

  await createBook(page, title);

  await expect(page.locator('.other-books-list')).toContainText(title);
});

test('Add book with empty title field', async ({ page }) => {
  await login(page);
  await page.goto('/create');
  await page.locator('#description').fill('This is a test book description');
  await page.locator('#image').fill('https://example.com/book-image.jpg');
  await page.locator('#type').selectOption('Fiction');

  const dialogPromise = page.waitForEvent('dialog');
  const clickPromise = page.locator('#create-form input[type="submit"]').click();
  const dialog = await dialogPromise;

  expect(dialog.type()).toBe('alert');
  expect(dialog.message()).toBe('All fields are required!');
  await dialog.accept();
  await clickPromise;

  await expect(page).toHaveURL(/\/create$/);
});

test('Login and verify all books are displayed', async ({ page }) => {
  await login(page);
  const title = uniqueBookTitle();
  await createBook(page, title);

  await expect(page.locator('.other-books-list li').filter({ hasText: title })).toBeVisible();
});

test('Login and navigate to Details page', async ({ page }) => {
  await login(page);
  const title = uniqueBookTitle();
  await createBook(page, title);

  const book = page.locator('.otherBooks').filter({ hasText: title });
  await book.locator('a.button').click();

  await expect(page.locator('.book-information h3')).toHaveText(title);
});

test('Verify visibility of Logout button after user login', async ({ page }) => {
  await login(page);

  await expect(page.locator('#logoutBtn')).toBeVisible();
});

test('Verify redirection of Logout link after user login', async ({ page }) => {
  await login(page);

  await Promise.all([
    page.waitForURL('**/catalog'),
    page.locator('#logoutBtn').click()
  ]);

  await expect(page.locator('#guest a[href="/login"]')).toBeVisible();
});
