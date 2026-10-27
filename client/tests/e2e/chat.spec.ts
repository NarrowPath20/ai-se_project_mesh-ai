import { expect, test } from '@playwright/test';
import { mockChats } from './chat-fixture';

test('a dropped backend connection shows an error bubble and restores the input', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('auth-token', 'test-token'));
  await page.route('**/api/users/me', (route) => route.fulfill({ json: { success: true, data: { userId: 'user', name: 'Test', email: 'test@example.com' }, error: null } }));
  await mockChats(page);
  await page.route('**/api/chats/*/messages', (route) => route.abort('connectionreset'));
  await page.goto('/chat');
  await page.getByRole('button', { name: 'Who are our users', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Message', exact: true });
  await expect(input).toBeEnabled();
  await input.fill('Question sent during an outage');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.chat__message_assistant').last()).toContainText('Something went wrong. Please try again.');
  await expect(input).toBeEnabled();
  await expect(page.locator('.chat__message_thinking')).toHaveCount(0);
});

test('created chats and server message pairs reload without optimistic duplicates', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('auth-token', 'test-token'));
  await page.route('**/api/users/me', (route) => route.fulfill({ json: {
    success: true, data: { userId: 'test-user', name: 'Test', email: 'test@example.com' }, error: null,
  } }));
  await mockChats(page);
  await page.goto('/chat');
  await expect(page.locator('.chat__item')).toHaveCount(3);
  await page.getByRole('button', { name: '+ New Chat', exact: true }).click();
  await page.getByRole('textbox', { name: 'Chat name' }).fill('Persisted chat');
  const created = page.waitForRequest((request) => request.url().endsWith('/api/chats') && request.method() === 'POST');
  await page.getByRole('button', { name: 'Create chat', exact: true }).click();
  expect((await created).postDataJSON()).toEqual({ title: 'Persisted chat' });
  await expect(page.locator('.chat__item_active')).toHaveText('Persisted chat');
  await page.reload();
  await page.getByRole('button', { name: 'Persisted chat', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Ask a question below\s*to start the conversation/ })).toBeVisible();
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Question about my document');
  const sent = page.waitForRequest('**/api/chats/*/messages');
  await page.getByRole('button', { name: 'Send message' }).click();
  const request = await sent;
  expect(request.headers().authorization).toBe('Bearer test-token');
  expect(request.postDataJSON()).toEqual({ question: 'Question about my document' });
  await expect(page.getByRole('status')).toHaveText('Thinking…');
  await expect(page.locator('.chat__message_thinking')).toHaveCount(0);
  await expect(page.locator('.chat__message')).toHaveCount(2);
  await expect(page.locator('.chat__message_user')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Persisted chat', exact: true }).click();
  await expect(page.locator('.chat__message')).toHaveCount(2);
  await expect(page.locator('.chat__message_user')).toContainText('Question about my document');
  await expect(page.locator('.chat__message_assistant')).toContainText('The answer from your documents.');
});
