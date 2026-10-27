import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('auth-token', 'test-token');
      sessionStorage.setItem('seeded', 'true');
    }
  });
  await page.route('**/api/users/me', (route) => route.fulfill({ json: {
    success: true, data: { userId: 'user', name: 'Test', email: 'test@example.com' }, error: null,
  } }));
});

test('multipart upload disables selection and drops, uses server data, and reloads the list', async ({ page }) => {
  const documents: object[] = [];
  let finishUpload = () => {};
  const processing = new Promise<void>((resolve) => { finishUpload = resolve; });
  let uploadCount = 0;
  await page.route('**/api/documents', async (route) => {
    const request = route.request();
    expect(request.headers().authorization).toBe('Bearer test-token');
    if (request.method() === 'POST') {
      uploadCount++;
      expect(request.headers()['content-type']).toContain('multipart/form-data; boundary=');
      expect(request.postData()).toContain('name="file"; filename="saved.pdf"');
      await processing;
      const doc = { _id: 'database-id', fileName: 'saved.pdf', title: 'saved.pdf', userId: 'user', createdAt: new Date().toISOString() };
      documents.push(doc);
      await route.fulfill({ status: 201, json: { success: true, data: doc, error: null } });
    } else await route.fulfill({ json: { success: true, data: documents, error: null } });
  });
  await page.goto('/knowledge');
  await expect(page.getByText('No documents yet.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  await page.locator('input[type=file]').setInputFiles({ name: 'saved.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await expect(page.getByRole('status')).toHaveText('Uploading...');
  await expect(page.locator('input[type=file]')).toBeDisabled();
  await page.locator('.upload-area__zone').evaluate((element) => {
    const data = new DataTransfer();
    data.items.add(new File(['%PDF-1.4'], 'ignored.pdf', { type: 'application/pdf' }));
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: data }));
  });
  finishUpload();
  await expect(page.getByText('saved.pdf', { exact: true })).toBeVisible();
  await expect(page.locator('input[type=file]')).toBeEnabled();
  expect(uploadCount).toBe(1);
  await page.reload();
  await expect(page.getByText('saved.pdf', { exact: true })).toBeVisible();
});

for (const status of [400, 401]) {
  test(`upload handles ${status} and leaves no phantom document`, async ({ page }) => {
    await page.route('**/api/documents', (route) => route.fulfill(route.request().method() === 'POST'
      ? { status, json: { success: false, data: null, error: { message: 'Upload rejected' } } }
      : { json: { success: true, data: [], error: null } }));
    await page.goto('/knowledge');
    await expect(page.getByText('No documents yet.', { exact: true })).toBeVisible();
    await page.locator('input[type=file]').setInputFiles({ name: 'bad.pdf', mimeType: 'application/pdf', buffer: Buffer.from('bad') });
    if (status === 401) {
      await expect(page).toHaveURL(/\/login$/);
      expect(await page.evaluate(() => localStorage.getItem('auth-token'))).toBeNull();
    } else {
      await expect(page.getByRole('alert')).toHaveText('Upload rejected');
      await expect(page.locator('input[type=file]')).toBeEnabled();
      await expect(page.locator('.knowledge-base__document')).toHaveCount(0);
    }
  });
}
