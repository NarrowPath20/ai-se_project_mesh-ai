import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { app } from '../dist/app.js';
import User from '../dist/models/user.js';
import Chat from '../dist/models/chat.js';
import Document from '../dist/models/document.js';
import Chunk from '../dist/models/chunk.js';
import Message from '../dist/models/message.js';
import { getClient } from '../dist/utils/openai-client.js';

// Each run uses an isolated database, never the application's database.
await mongoose.connect(
  process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/meshai_test',
  {
    dbName: 'meshai_test_' + randomUUID().replaceAll('-', ''),
    serverSelectionTimeoutMS: 5000,
  },
);
await User.init();
process.env.JWT_SECRET = randomUUID();
process.env.NEBIUS_API_KEY = 'test-key';
const client = getClient();
const embeddingInputs = [];
client.embeddings.create = async ({ input }) => {
  embeddingInputs.push(input);
  return { data: [{ embedding: [1, 0, 0] }] };
};
client.chat.completions.create = async ({ messages }) => {
  assert.match(messages[1].content, /MeshAI launch code is ORION/);
  assert.doesNotMatch(messages[1].content, /OTHER_USER_PRIVATE/);
  return { choices: [{ message: { content: 'The launch code is ORION.' } }] };
};
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
const request = async (method, path, body, token) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  assert.deepEqual(Object.keys(data).sort(), ['data', 'error', 'success']);
  assert.equal(data.success, response.ok);
  if (!response.ok) {
    assert.equal(data.data, null);
    assert.equal(typeof data.error.message, 'string');
  } else assert.equal(data.error, null);
  return { status: response.status, body: data.data, error: data.error };
};
// A small valid PDF exercises the real parser without a binary dependency.
const pdf = () => {
  const stream = 'BT /F1 12 Tf 72 720 Td (MeshAI launch code is ORION.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream',
  ];
  let result = '%PDF-1.4\n';
  const offsets = [0];
  for (const [i, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(result));
    result += i + 1 + ' 0 obj\n' + object + '\nendobj\n';
  }
  const start = Buffer.byteLength(result);
  result +=
    'xref\n0 6\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n')
      .join('');
  return (
    result +
    'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' +
    start +
    '\n%%EOF\n'
  );
};
test('MongoDB auth, ownership, PDF extraction, retrieval, generation, and persisted messages', async () => {
  assert.equal((await request('GET', '/health')).status, 200);
  assert.equal((await request('GET', '/test-error')).status, 404);
  const unauthenticated = await request('GET', '/auth/me');
  assert.equal(unauthenticated.status, 401);
  assert.match(unauthenticated.error.message, /Authorization: Bearer/);
  assert.equal(
    (
      await request('POST', '/auth/register', {
        email: 'test@example.com',
        password: 'short',
        name: 'Test',
      })
    ).status,
    400,
  );
  const registration = await request('POST', '/auth/register', {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test',
  });
  assert.equal(registration.status, 201);
  assert.deepEqual(Object.keys(registration.body).sort(), [
    'email',
    'name',
    'userId',
  ]);
  const storedUser = await User.findById(registration.body.userId).select(
    '+password',
  );
  assert.notEqual(storedUser.password, 'password123');
  assert.ok(await bcrypt.compare('password123', storedUser.password));
  assert.equal(
    (
      await request('POST', '/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      })
    ).status,
    409,
  );
  const missing = await request('POST', '/auth/login', {
    email: 'missing@example.com',
    password: 'password123',
  });
  const wrong = await request('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'incorrect',
  });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong.error, missing.error);
  const login = await request('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  const token = login.body.token;
  const currentUser = await request('GET', '/auth/me', undefined, token);
  assert.equal(currentUser.status, 200);
  assert.deepEqual(login.body.user, registration.body);
  assert.equal(
    (await request('POST', '/auth/logout', undefined, token)).status,
    404,
  );
  assert.equal(
    (await request('GET', '/chats', undefined, 'invalid')).error.message,
    'Invalid token',
  );
  assert.deepEqual(currentUser.body, registration.body);
  assert.equal(
    jwt.verify(token, process.env.JWT_SECRET).userId,
    String(storedUser._id),
  );
  for (const [method, path] of [
    ['GET', '/chats'],
    ['POST', '/chats'],
    ['GET', '/chats/123'],
    ['POST', '/chats/123/messages'],
    ['GET', '/documents'],
    ['POST', '/documents'],
    ['POST', '/query'],
  ]) {
    assert.equal((await request(method, path)).status, 401);
    assert.equal(
      (await request(method, path, undefined, 'invalid')).status,
      401,
    );
  }
  const expired = jwt.sign(
    { userId: String(storedUser._id) },
    process.env.JWT_SECRET,
    { expiresIn: -1 },
  );
  assert.equal(
    (await request('GET', '/chats', undefined, expired)).status,
    401,
  );
  assert.equal((await request('POST', '/chats', {}, token)).status, 400);
  const chat = await request('POST', '/chats', { title: 'Research' }, token);
  assert.equal(chat.status, 201);
  assert.equal(
    (await request('GET', '/chats', undefined, token)).body.length,
    1,
  );
  assert.equal(
    (await request('GET', '/chats/invalid', undefined, token)).status,
    400,
  );
  const otherId = new mongoose.Types.ObjectId();
  const privateChat = await Chat.create({ title: 'Private', userId: otherId });
  const privateDoc = await Document.create({
    title: 'Private',
    fileName: 'private.pdf',
    userId: otherId,
  });
  await Chunk.create({
    documentId: privateDoc._id,
    text: 'OTHER_USER_PRIVATE',
    embedding: [1, 0, 0],
  });
  for (const path of [
    '/chats/' + privateChat._id,
    '/documents/' + privateDoc._id,
  ])
    assert.equal((await request('GET', path, undefined, token)).status, 404);
  assert.equal(
    (
      await request(
        'POST',
        '/chats/' + privateChat._id + '/messages',
        { question: 'Secret?' },
        token,
      )
    ).status,
    404,
  );
  assert.equal(
    (await request('POST', '/documents', undefined, token)).status,
    400,
  );
  const upload = async (content, name) => {
    const form = new FormData();
    form.set('file', new Blob([content], { type: 'application/pdf' }), name);
    const response = await fetch(base + '/documents', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: form,
    });
    return { status: response.status, body: await response.json() };
  };
  assert.equal((await upload('not a pdf', 'bad.pdf')).status, 400);
  const uploaded = await upload(pdf(), 'launch.pdf');
  assert.equal(uploaded.status, 201);
  const chunks = await Chunk.find({ documentId: uploaded.body.data._id });
  assert.ok(chunks.length > 0);
  assert.match(chunks[0].text, /ORION/);
  assert.deepEqual(chunks[0].embedding, [1, 0, 0]);
  assert.equal(
    (await request('GET', '/documents', undefined, token)).body.length,
    1,
  );
  assert.equal((await request('POST', '/query', {}, token)).status, 400);
  const query = await request(
    'POST',
    '/query',
    { question: 'What is the launch code?' },
    token,
  );
  assert.equal(query.status, 200);
  assert.match(query.body.answer, /ORION/);
  assert.equal(query.body.sources.length, chunks.length);
  const path = '/chats/' + chat.body._id;
  assert.equal(
    (await request('POST', path + '/messages', {}, token)).status,
    400,
  );
  const messages = await request(
    'POST',
    path + '/messages',
    { question: 'What is the launch code?' },
    token,
  );
  assert.equal(messages.status, 201);
  assert.deepEqual(
    messages.body.map((m) => m.role),
    ['user', 'assistant'],
  );
  const history = await request('GET', path, undefined, token);
  assert.equal(history.body.messages.length, 2);
  client.chat.completions.create = async () => {
    throw new Error('Simulated provider failure');
  };
  assert.equal(
    (await request('POST', path + '/messages', { question: 'Retry?' }, token))
      .status,
    500,
  );
  assert.equal(await Message.countDocuments({ chatId: chat.body._id }), 2);
  assert.ok(embeddingInputs.some((s) => s.includes('ORION')));
  assert.equal((await request('GET', '/nonexistent')).status, 404);
  const malformed = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.equal(
    (await malformed.json()).error.message,
    'Invalid JSON request body',
  );
});
