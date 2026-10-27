import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`long chat scrolls to loaded and new messages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('auth-token', 'test-token'));
    await page.route('**/api/users/me', (route) => route.fulfill({ json: { success: true, data: { userId: 'user', name: 'Test', email: 'test@example.com' }, error: null } }));
    const chat = { _id: 'long', title: 'Long conversation', userId: 'user', createdAt: new Date().toISOString() };
    const message = (index: number, content: string, role = 'assistant') => ({ _id: String(index), chatId: 'long', role, content, createdAt: new Date().toISOString() });
    const history = Array.from({ length: 50 }, (_, index) => message(index, `Saved reply ${index}.\n\n${'Document context and answers. '.repeat(10)}`));
    await page.route('**/api/chats', (route) => route.fulfill({ json: { success: true, data: [chat], error: null } }));
    await page.route('**/api/chats/long', (route) => route.fulfill({ json: { success: true, data: { chat, messages: history }, error: null } }));
    await page.route('**/api/chats/long/messages', (route) => route.fulfill({ json: { success: true, data: [message(50, route.request().postDataJSON().question, 'user'), message(51, 'Newest assistant reply.\n\n' + 'New answer. '.repeat(30))], error: null } }));
    await page.goto('/chat');
    if (width < 1200) await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Long conversation', exact: true }).click();
    const composer = page.locator('.chat__input-bar');
    await expect(composer).toHaveCSS('position', 'fixed');
    await expect(composer).toHaveCSS('z-index', '100');
    const assertLatestVisible = async () => {
      await expect.poll(async () => {
        const last = await page.locator('.chat__message').last().boundingBox();
        const bar = await composer.boundingBox();
        return Boolean(last && bar && last.y + last.height <= bar.y && last.y + last.height > 0);
      }).toBe(true);
    };
    await assertLatestVisible();
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('A new question');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('.chat__message').last()).toContainText('Newest assistant reply.');
    await assertLatestVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
