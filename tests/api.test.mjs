import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { app } from '../dist/app.js';

const endpoints = JSON.parse(
  await readFile(new URL('./endpoints.json', import.meta.url), 'utf8'),
);
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
after(() => new Promise((resolve) => server.close(resolve)));

for (const [method, path, status] of endpoints) {
  test(`${method} ${path} returns ${status}`, async () => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      ...(['POST', 'PATCH'].includes(method)
        ? { headers: { 'Content-Type': 'application/json' }, body: '{}' }
        : {}),
    });
    assert.equal(response.status, status);
    if (status === 204) {
      assert.equal(await response.text(), '');
      return;
    }
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ['data', 'error', 'success']);
    assert.equal(body.success, status < 400);
    if (status < 400) {
      assert.equal(body.error, null);
      assert.ok(body.data && typeof body.data === 'object');
    } else {
      assert.equal(body.data, null);
      assert.equal(
        body.error,
        status === 404
          ? 'Route GET /nonexistent not found'
          : 'An error has occurred on the server',
      );
    }
    if (path === '/health') assert.deepEqual(body.data, { status: 'ok' });
  });
}

test('Malformed JSON returns a consistent 400 response', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    data: null,
    error: 'Invalid JSON request body',
  });
});
