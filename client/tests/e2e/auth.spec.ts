import { expect, test } from '@playwright/test';

for (const isRegister of [false, true]) {
  test(`${isRegister ? 'register' : 'login'} validation and API submission`, async ({ page }) => {
    await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ body: '', contentType: 'text/css' }));
    const submitted: unknown[] = [];
    const consoleMessages: string[] = [];
    page.on('console', (message) => consoleMessages.push(message.text()));
    const user = { userId: 'test-user', name: 'Test User', email: 'test@example.com' };
    await page.route('**/api/auth/*', async (route) => {
      submitted.push(route.request().postDataJSON());
      await route.fulfill({ json: { success: true, data: isRegister ? user : { token: 'test-token', user }, error: null } });
    });
    await page.route('**/api/users/me', (route) => route.fulfill({ json: { success: true, data: user, error: null } }));
    await page.route('**/api/documents', (route) => route.fulfill({ json: { success: true, data: [], error: null } }));
    await page.goto(isRegister ? '/register' : '/login');
    await expect(page.locator('header img')).toBeVisible();
    await expect(page.locator('header nav')).toHaveCount(0);
    const submit = page.getByRole('button', { name: isRegister ? 'Register' : 'Login', exact: true });
    await expect(submit).toBeDisabled();
    if (isRegister) {
      await page.getByLabel('Name', { exact: true }).fill('A');
      await expect(page.locator('#name-error')).not.toBeEmpty();
      await page.getByLabel('Name', { exact: true }).fill('Test User');
    }
    await page.getByLabel('Password', { exact: true }).fill('short');
    await expect(page.locator('#password-error')).not.toBeEmpty();
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await expect(submit).toBeDisabled();
    await page.getByLabel('Email', { exact: true }).fill('invalid');
    await expect(page.locator('#email-error')).not.toBeEmpty();
    await expect(submit).toBeDisabled();
    await page.getByLabel('Email', { exact: true }).fill('test@example.com');
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect.poll(() => submitted).toContainEqual({
      ...(isRegister ? { name: 'Test User' } : {}),
      email: 'test@example.com', password: 'password123',
    });
    await expect(page).toHaveURL(isRegister ? /\/login$/ : /\/knowledge$/);
    expect(await page.evaluate(() => localStorage.getItem('auth-token'))).toBe(isRegister ? null : 'test-token');
    await expect(page.locator('body')).not.toContainText('test-token');
    expect(consoleMessages.join('\n')).not.toContain('test-token');
    if (!isRegister) {
      await page.getByRole('button', { name: "Test User's Account" }).click();
      await page.getByRole('menuitem', { name: 'Logout' }).click();
    }
    await page.goto(isRegister ? '/register' : '/login');
    const otherPage = isRegister ? 'Login' : 'Register';
    await page.getByRole('link', { name: otherPage, exact: true }).click();
    await expect(page).toHaveURL(isRegister ? /\/login$/ : /\/register$/);
    await expect(page.getByRole('link', { name: otherPage, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: otherPage, exact: true })).toBeDisabled();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('backend errors appear in the form and failed login keeps the token empty', async ({ page }) => {
  await page.route('**/api/auth/register', (route) => route.fulfill({ status: 409, json: { success: false, data: null, error: { message: 'Email already in use' } } }));
  await page.route('**/api/auth/login', (route) => route.fulfill({ status: 401, json: { success: false, data: null, error: { message: 'Invalid email or password' } } }));
  await page.goto('/register');
  await page.getByLabel('Name', { exact: true }).fill('Test User');
  await page.getByLabel('Email', { exact: true }).fill('used@example.com');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Email already in use');
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill('used@example.com');
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
  await page.evaluate(() => { document.documentElement.dataset.reloadCheck = 'preserved'; });
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Invalid email or password');
  await expect(page.locator('html')).toHaveAttribute('data-reload-check', 'preserved');
  expect(await page.evaluate(() => localStorage.getItem('auth-token'))).toBeNull();
});

test('stale session clears its token and redirects to login', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('auth-token', 'expired-token');
      sessionStorage.setItem('seeded', 'true');
    }
  });
  await page.route('**/api/users/me', async (route) => {
    expect(route.request().headers().authorization).toBe('Bearer expired-token');
    await route.fulfill({ status: 401, json: { success: false, data: null, error: { message: 'Invalid token' } } });
  });
  await page.goto('/knowledge');
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('auth-token'))).toBeNull();
});
