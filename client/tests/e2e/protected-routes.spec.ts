import { expect, test } from '@playwright/test';

test('login returns to the protected route originally requested', async ({ page }) => {
  await page.route('**/api/chats', (route) => route.fulfill({ json: { success: true, data: [], error: null } }));
  await page.route('**/api/auth/login', (route) => route.fulfill({ json: {
    success: true, data: { token: 'test-token', user: { userId: 'user', email: 'test@example.com', name: 'Test' } }, error: null,
  } }));
  await page.goto('/chat');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email', { exact: true }).fill('test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole('button', { name: "Test's Account" })).toBeVisible();
});

test('signed-out users cannot open protected pages directly', async ({ page }) => {
  for (const path of ['/knowledge', '/chat']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.knowledge-base, .chat')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  }
});

test('session restore waits, preserves chat on refresh, guards public pages and logs out', async ({ page }) => {
  await page.route('**/api/chats', (route) => route.fulfill({ json: { success: true, data: [], error: null } }));
  await page.route('**/api/documents', (route) => route.fulfill({ json: { success: true, data: [], error: null } }));
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('auth-token', 'valid-test-token');
      sessionStorage.setItem('seeded', 'true');
    }
  });
  let releaseRestore: () => void = () => {};
  const restoreReady = new Promise<void>((resolve) => { releaseRestore = resolve; });
  let restoring = false;
  await page.route('**/api/users/me', async (route) => {
    restoring = true;
    await restoreReady;
    await route.fulfill({ json: { success: true, data: {
      userId: 'test-user', name: 'Test User', email: 'test@example.com',
    }, error: null } });
  });
  await page.goto('/chat');
  await expect.poll(() => restoring).toBe(true);
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.locator('.chat')).toHaveCount(0);
  releaseRestore();
  const account = page.getByRole('button', { name: "Test User's Account" });
  await expect(account).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start New Chat', exact: true })).toBeVisible();
  await page.reload();
  await expect(account).toBeVisible();
  await expect(page).toHaveURL(/\/chat$/);
  for (const path of ['/login', '/register']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/knowledge$/);
    await expect(account).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await account.click();
  await expect(account).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(account).toBeFocused();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await account.click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('auth-token'))).toBeNull();
  await expect(account).toHaveCount(0);
  await page.goto('/knowledge');
  await expect(page).toHaveURL(/\/login$/);
});
