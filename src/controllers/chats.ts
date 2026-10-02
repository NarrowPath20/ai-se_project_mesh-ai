import type { RequestHandler } from 'express';

const chat = {
  chatId: 'chat_001',
  title: 'Demo chat',
  createdAt: '2026-01-01T00:00:00Z',
};

export const listChats: RequestHandler = (_req, res): void => {
  res.status(200).json({ success: true, data: { chats: [chat] }, error: null });
};

export const getChat: RequestHandler = (req, res): void => {
  res.status(200).json({
    success: true,
    data: { ...chat, chatId: req.params.chatId },
    error: null,
  });
};

export const createChat: RequestHandler = (_req, res): void => {
  res.status(201).json({ success: true, data: chat, error: null });
};

export const updateChat: RequestHandler = (req, res): void => {
  res.status(200).json({
    success: true,
    data: { ...chat, chatId: req.params.chatId },
    error: null,
  });
};

export const deleteChat: RequestHandler = (_req, res): void => {
  res.status(204).send();
};
