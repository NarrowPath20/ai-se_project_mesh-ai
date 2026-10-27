import type { Page } from '@playwright/test';

export async function mockChats(page: Page) {
  const chats = ['What is posthog', 'Who are our users', 'Marketing Hypothesis'].map((title, index) => ({
    _id: `chat-${index + 1}`, title, userId: 'test-user', createdAt: new Date().toISOString(),
  }));
  const histories: Record<string, object[]> = Object.fromEntries(chats.map((chat) => [chat._id,
    ['Who are our users?', '**Teams** working with shared knowledge.', 'What are their needs?', '### Main user needs\n\n1. Documents\n2. Answers'].map((content, index) => ({
      _id: `${chat._id}-${index}`, chatId: chat._id, role: index % 2 ? 'assistant' : 'user', content, createdAt: new Date().toISOString(),
    })),
  ]));
  await page.route('**/api/chats', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (route.request().method() === 'POST') {
      const chat = { _id: `chat-${chats.length + 1}`, title: route.request().postDataJSON().title, userId: 'test-user', createdAt: new Date().toISOString() };
      chats.unshift(chat);
      histories[chat._id] = [];
      await route.fulfill({ status: 201, json: { success: true, data: chat, error: null } });
    } else await route.fulfill({ json: { success: true, data: chats, error: null } });
  });
  await page.route('**/api/chats/*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const id = route.request().url().split('/').pop()!;
    await route.fulfill({ json: { success: true, data: { chat: chats.find((chat) => chat._id === id), messages: histories[id] ?? [] }, error: null } });
  });
  await page.route('**/api/chats/*/messages', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const id = route.request().url().split('/').at(-2)!;
    const pair = ['user', 'assistant'].map((role, index) => ({
      _id: `${id}-${histories[id].length + index}`, chatId: id, role,
      content: role === 'user' ? route.request().postDataJSON().question : 'The answer from your documents.', createdAt: new Date().toISOString(),
    }));
    histories[id].push(...pair);
    await route.fulfill({ status: 201, json: { success: true, data: pair, error: null } });
  });
}
