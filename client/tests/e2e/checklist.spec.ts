import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mockChats } from './chat-fixture';

test.beforeEach(async ({ page }) => {
  await mockChats(page);
  await page.route('**/api/documents', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const fileName = route.request().postData()?.match(/filename="([^"]+)"/)?.[1] ?? 'uploaded.pdf';
    const doc = (name: string) => ({ _id: name, fileName: name, title: name, userId: 'test-user', createdAt: new Date().toISOString() });
    await route.fulfill({ json: { success: true, data: route.request().method() === 'POST'
      ? doc(fileName)
      : ['code-review-guidelines.pdf', 'onboarding-handbook.pdf', 'engineering-best-practices.pdf'].map(doc), error: null } });
  });
  await page.addInitScript(() => localStorage.setItem('auth-token', 'test-token'));
  await page.route('**/api/users/me', (route) => route.fulfill({ json: {
    success: true, data: { userId: 'test-user', email: 'test@example.com', name: 'Test User' }, error: null,
  } }));
  // External font availability should not affect local application checks.
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ body: '', contentType: 'text/css' }));
});

async function changeStub(page: Page, name: string, injectedCode: string) {
  if (name === 'getChat' || name === 'sendMessage') {
    await page.route(name === 'getChat' ? '**/api/chats/*' : '**/api/chats/*/messages', (route) =>
      route.fulfill({ status: 500, json: { success: false, data: null, error: { message: 'Test error' } } }));
    return;
  }
  if (name === 'getDocuments') {
    await page.route('**/api/documents', (route) => route.fulfill(injectedCode.includes('throw')
      ? { status: 500, json: { success: false, data: null, error: { message: 'Test error' } } }
      : { json: { success: true, data: [], error: null } }));
    return;
  }
  await page.route('**/src/utils/api.ts', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const pattern = new RegExp(`(${name} = async \\([^)]*\\) => \\{)`);
    expect(body).toMatch(pattern);
    await route.fulfill({ response, body: body.replace(pattern, `$1\n${injectedCode}`) });
  });
}

test('routes, refresh, Start, active links and favicon', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('header')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Welcome to Mesh AI' })).toBeVisible();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page).toHaveURL(/\/knowledge$/);
  for (const path of ['/knowledge', '/chat', '/']) {
    await page.goto(path);
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : path + '$'}`));
    await expect(page.locator('header')).toHaveCount(path === '/' ? 0 : 1);
    if (path !== '/') await expect(page.locator('.header__link_active')).toHaveAttribute('href', path);
  }
  const favicon = await page.request.get('/favicon.png');
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toContain('image/png');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.png');
  expect(errors).toEqual([]);
});

test('documents load, file selection and dropping PDFs update the list', async ({ page }) => {
  await page.goto('/knowledge');
  await expect(page.getByRole('status')).toContainText('Loading documents');
  await page.locator('input[type=file]').setInputFiles({ name: 'early.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await expect(page.getByText('early.pdf', { exact: true })).toBeVisible();
  await expect(page.getByText('code-review-guidelines.pdf', { exact: true })).toBeVisible();
  await page.locator('.upload-area__zone').evaluate((element) => {
    const data = new DataTransfer();
    data.items.add(new File(['%PDF-1.4'], 'dropped.pdf', { type: 'application/pdf' }));
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: data }));
  });
  await expect(page.getByText('dropped.pdf', { exact: true })).toBeVisible();
});

test('documents empty state', async ({ page }) => {
  await changeStub(page, 'getDocuments', 'return { success: true, data: [], error: null };');
  await page.goto('/knowledge');
  await expect(page.getByText('No documents yet.', { exact: true })).toBeVisible();
});

test('PDFs can be removed, including the last file and uploaded files', async ({ page }) => {
  await page.goto('/knowledge');
  await expect(page.locator('.knowledge-base__document')).toHaveCount(3);
  await page.getByRole('button', { name: 'Delete code-review-guidelines.pdf', exact: true }).click();
  await expect(page.getByText('code-review-guidelines.pdf', { exact: true })).toHaveCount(0);
  await page.locator('input[type=file]').setInputFiles({ name: 'remove-me.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await page.getByRole('button', { name: 'Delete remove-me.pdf', exact: true }).click();
  await expect(page.getByText('remove-me.pdf', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete onboarding-handbook.pdf', exact: true }).click();
  await page.getByRole('button', { name: 'Delete engineering-best-practices.pdf', exact: true }).click();
  await expect(page.getByText('No documents yet.', { exact: true })).toBeVisible();
});

test('creating chats and uploading PDFs works without crypto.randomUUID', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true }));
  await page.goto('/chat');
  await page.getByRole('button', { name: '+ New Chat', exact: true }).click();
  await page.getByRole('textbox', { name: 'Chat name' }).fill('HTTP compatible chat');
  await page.getByRole('button', { name: 'Create chat', exact: true }).click();
  await expect(page.locator('.chat__item_active')).toHaveText('HTTP compatible chat');
  await expect(page.getByRole('heading', { name: /Ask a question below\s*to start the conversation/ })).toBeVisible();
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.chat__message')).toHaveCount(2);
  await page.goto('/knowledge');
  await page.locator('input[type=file]').setInputFiles({ name: 'http.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await expect(page.getByText('http.pdf', { exact: true })).toBeVisible();
});

test('documents error state', async ({ page }) => {
  await changeStub(page, 'getDocuments', 'throw new Error("Test error");');
  await page.goto('/knowledge');
  await expect(page.getByRole('alert')).toHaveText('Failed to load documents.');
});

test('sidebar loading, selection, creation, default title and cancellation', async ({ page }) => {
  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: 'Create a new chat or select an existing one to start the conversation' })).toBeVisible();
  const sidebar = page.getByRole('complementary', { name: 'Conversations' });
  await expect(sidebar.getByRole('button', { name: 'What is posthog', exact: true })).toBeVisible();
  await expect(sidebar.locator('.chat__item')).toHaveCount(3);
  await sidebar.getByRole('button', { name: 'Who are our users', exact: true }).click();
  await expect(sidebar.locator('.chat__item_active')).toHaveText('Who are our users');
  await sidebar.getByRole('button', { name: '+ New Chat', exact: true }).click();
  const name = page.getByRole('textbox', { name: 'Chat name' });
  await expect(name).toBeFocused();
  await name.fill('Research');
  await name.press('Enter');
  await expect(sidebar.locator('.chat__item').first()).toHaveText('Research');
  await expect(sidebar.locator('.chat__item_active')).toHaveText('Research');
  await expect(page.getByRole('heading', { name: /Ask a question below\s*to start the conversation/ })).toBeVisible();
  await sidebar.getByRole('button', { name: '+ New Chat', exact: true }).click();
  await name.fill('Cancelled');
  await name.press('Escape');
  await expect(name).toHaveCount(0);
  await expect(sidebar.locator('.chat__item')).toHaveCount(4);
  await sidebar.getByRole('button', { name: '+ New Chat', exact: true }).click();
  await name.fill('   ');
  await name.press('Enter');
  await expect(sidebar.locator('.chat__item').first()).toHaveText('New Chat');
});

test('message loading, Markdown, optimistic send, delay, keyboard and disabled controls', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  await page.goto('/chat');
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Who are our users', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Loading...');
  await expect(page.locator('.chat__message')).toHaveCount(4);
  await expect(page.locator('.chat__message_assistant strong')).toBeVisible();
  await expect(page.locator('.chat__message_assistant ol')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Main user needs' })).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Message', exact: true });
  const send = page.getByRole('button', { name: 'Send message' });
  await expect(send).toBeDisabled();
  await input.fill('   ');
  await expect(send).toBeDisabled();
  await input.fill('A new question');
  await input.press('Shift+Enter');
  await expect(input).toHaveValue('A new question\n');
  await expect(page.locator('.chat__message')).toHaveCount(4);
  await input.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Thinking…');
  await expect(page.locator('.chat__message_user')).toHaveCount(3);
  await expect(input).toHaveValue('');
  await expect(input).toBeDisabled();
  await expect(send).toBeDisabled();
  await expect(page.locator('.chat__message')).toHaveCount(6);
  await expect(input).toBeEnabled();
  await input.fill('Click send');
  await send.click();
  await expect(page.getByRole('status')).toHaveText('Thinking…');
  await expect(page.locator('.chat__message')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('message loading failure', async ({ page }) => {
  await changeStub(page, 'getChat', 'throw new Error("Test error");');
  await page.goto('/chat');
  await page.getByRole('button', { name: 'Who are our users', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText("Looks like something went wrong");
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveCount(0);
});

test('send failure retains user message and shows assistant error', async ({ page }) => {
  await changeStub(page, 'sendMessage', 'throw new Error("Test error");');
  await page.goto('/chat');
  await page.getByRole('button', { name: 'Who are our users', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Message', exact: true });
  await input.fill('Question');
  await input.press('Enter');
  await expect(page.locator('.chat__message_user').last()).toContainText('Question');
  await expect(page.locator('.chat__message_assistant').last()).toContainText('Something went wrong. Please try again.');
  await expect(input).toBeEnabled();
});

for (const width of [390, 1199]) {
  test(`mobile menu and chat sidebar at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/chat');
    const menu = page.getByRole('button', { name: 'Open menu' });
    const drawer = page.getByRole('dialog');
    await expect(menu).toBeVisible();
    const hamburgerBox = await menu.boundingBox();
    const logoBox = await page.locator('.header__logo').boundingBox();
    expect(hamburgerBox!.x).toBeLessThan(logoBox!.x);
    await expect(page.locator('.header__nav')).toBeHidden();
    await menu.click();
    await expect(drawer).toBeVisible();
    await expect(page.locator('.app-layout__backdrop')).toBeVisible();
    await expect(drawer.getByRole('navigation')).toBeVisible();
    await page.locator('.app-layout__backdrop').click({ position: { x: width - 5, y: 400 } });
    await expect(drawer).toBeHidden();
    await page.getByRole('button', { name: 'Start New Chat', exact: true }).click();
    const name = page.getByRole('textbox', { name: 'Chat name' });
    await expect(drawer).toBeVisible();
    await expect(name).toBeFocused();
    await name.fill('Mobile chat');
    await name.press('Enter');
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('heading', { name: /Ask a question below\s*to start the conversation/ })).toBeVisible();
    await menu.click();
    await drawer.getByRole('button', { name: 'Who are our users', exact: true }).click();
    await expect(drawer).toBeHidden();
    await expect(page.locator('.chat__message')).toHaveCount(4);
    await menu.click();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(menu).toBeHidden();
    await expect(page.locator('.header__nav')).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Conversations' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('mobile navigation works on Knowledge Base and focus stays in the open panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/knowledge');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByRole('link', { name: 'Chat', exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(drawer).toBeHidden();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(drawer).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await drawer.getByRole('link', { name: 'Knowledge Base', exact: true }).click();
  await expect(page).toHaveURL(/\/knowledge$/);
  await expect(drawer).toBeHidden();
});

test('switching conversations while sending never inserts a reply in the wrong chat', async ({ page }) => {
  await page.goto('/chat');
  await page.getByRole('button', { name: 'Who are our users', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Message', exact: true });
  await input.fill('Unique pending question');
  await input.press('Enter');
  await page.getByRole('button', { name: 'What is posthog', exact: true }).click();
  await expect(page.locator('.chat__message')).toHaveCount(4);
  await expect(input).toBeEnabled();
  await expect(page.locator('.chat__messages')).not.toContainText('Unique pending question');
});

test('Part 4 desktop and mobile geometry and exported illustrations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto('/');
  const intro = await page.locator('.intro').boundingBox();
  expect(intro).toMatchObject({ x: 385, y: 158, width: 670, height: 444 });
  await expect(page.locator('.intro__card')).toHaveCount(3);
  expect(await page.locator('.intro__features img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.goto('/chat');
  await expect(page.locator('.chat__sidebar')).toHaveCSS('width', '220px');
  expect((await page.locator('.chat__main').boundingBox())?.x).toBe(385);
  await page.setViewportSize({ width: 394, height: 852 });
  await page.goto('/');
  await expect(page.locator('.intro__card').first()).toHaveCSS('height', '142px');
  await page.goto('/chat');
  await expect(page.locator('header')).toHaveCSS('height', '61px');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog')).toHaveCSS('width', '256px');
  expect((await page.getByRole('dialog').boundingBox())?.y).toBe(61);
  await page.getByRole('button', { name: 'What is posthog', exact: true }).click();
  await expect(page.locator('.chat__message')).toHaveCount(4);
  await expect(page.locator('.chat__input-bar')).toHaveCSS('height', '100px');
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
