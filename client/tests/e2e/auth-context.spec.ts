import { expect, test } from '@playwright/test';

test('auth provider settles signed out and shares login/logout state across routes', async ({ page }) => {
  await page.route('**/api/chats', (route) => route.fulfill({ json: { success: true, data: [], error: null } }));
  await page.route('**/api/documents', (route) => route.fulfill({ json: { success: true, data: [], error: null } }));
  const user = { userId: 'test-user', email: 'test@example.com', name: 'Test' };
  await page.route('**/api/users/me', (route) => route.fulfill({ json: { success: true, data: user, error: null } }));
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ body: '', contentType: 'text/css' }));
  // Add a test-only consumer inside the real provider; application UI stays unchanged.
  await page.route('**/src/main.tsx', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const routerImport = source.match(/import\s*\{\s*BrowserRouter\s*\}\s*from\s*["']([^"']+)["']/);
    if (!routerImport) throw new Error('BrowserRouter import missing from entry point');
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
const { createElement, Fragment, StrictMode } = React;
const { createRoot } = ReactDOM;
import { BrowserRouter } from '${routerImport[1]}';
import { AuthProvider, useAuth } from '/src/contexts/AuthContext.tsx';
import App from '/src/components/App/App.tsx';
import '/src/index.css';
function AuthProbe() {
  const auth = useAuth();
  return createElement(Fragment, null,
    createElement('output', { 'data-testid': 'auth-state' }, JSON.stringify({
      currentUser: auth.currentUser, isAuthenticated: auth.isAuthenticated, isLoading: auth.isLoading
    })),
    createElement('button', { onClick: () => auth.login('test-token', { userId: 'test-user', email: 'test@example.com', name: 'Test' }) }, 'Test login'),
    createElement('button', { onClick: auth.logout }, 'Test logout'),
    createElement(App)
  );
}
createRoot(document.getElementById('root')).render(
  createElement(StrictMode, null, createElement(AuthProvider, null,
    createElement(BrowserRouter, null, createElement(AuthProbe)))));
`,
    });
  });
  await page.goto('/login');
  const state = page.getByTestId('auth-state');
  await expect(state).toHaveText(JSON.stringify({ currentUser: null, isAuthenticated: false, isLoading: false }));
  await page.getByRole('button', { name: 'Test login', exact: true }).click();
  await expect(state).toContainText('"isAuthenticated":true');
  await page.getByRole('link', { name: 'Chat', exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(state).toContainText('"userId":"test-user"');
  await page.reload();
  await expect(state).toContainText('"isLoading":false');
  await expect(state).toContainText('"userId":"test-user"');
  await page.getByRole('button', { name: 'Test logout', exact: true }).click();
  await expect(state).toHaveText(JSON.stringify({ currentUser: null, isAuthenticated: false, isLoading: false }));
  expect(await page.evaluate(() => localStorage.getItem('auth-token'))).toBeNull();
});
