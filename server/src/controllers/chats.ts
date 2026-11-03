import type { RequestHandler } from 'express';
import Chat from '../models/chat.js';
import Message from '../models/message.js';
import { HttpError, requiredText } from '../utils/http-error.js';
import {
  getCacheValue,
  setCacheValue,
  deleteCacheValue,
} from '../utils/cache.js';
export const getChats: RequestHandler = async (req, res): Promise<void> => {
  const key = `chats:${req.user!.userId}`;
  let chats = getCacheValue<Promise<unknown[]>>(key);
  if (chats === undefined) {
    chats = Chat.find({ userId: req.user!.userId }).lean().exec();
    setCacheValue(key, chats);
  }
  let data: unknown[];
  try {
    data = await chats;
  } catch (error) {
    if (getCacheValue(key) === chats) deleteCacheValue(key);
    throw error;
  }
  res.json({
    success: true,
    data,
    error: null,
  });
};
export const createChat: RequestHandler = async (req, res): Promise<void> => {
  const { title } = req.body ?? {};
  if (!requiredText(title)) throw new HttpError(400, 'title is required');
  const chat = await Chat.create({ title, userId: req.user!.userId });
  deleteCacheValue(`chats:${req.user!.userId}`);
  res.status(201).json({ success: true, data: chat, error: null });
};
export const getChat: RequestHandler = async (req, res): Promise<void> => {
  const chat = await Chat.findOne({
    _id: req.params.id,
    userId: req.user!.userId,
  });
  if (!chat) throw new HttpError(404, 'Chat not found');
  const messages = await Message.find({ chatId: chat._id }).sort({
    createdAt: 1,
    _id: 1,
  });
  res.json({ success: true, data: { chat, messages }, error: null });
};
export const updateChat: RequestHandler = async (req, res): Promise<void> => {
  if (!requiredText(req.body?.title))
    throw new HttpError(400, 'title is required');
  const chat = await Chat.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    { title: req.body.title },
    { new: true, runValidators: true },
  );
  if (!chat) throw new HttpError(404, 'Chat not found');
  deleteCacheValue(`chats:${req.user!.userId}`);
  res.json({ success: true, data: chat, error: null });
};
export const deleteChat: RequestHandler = async (req, res): Promise<void> => {
  const chat = await Chat.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.userId,
  });
  if (!chat) throw new HttpError(404, 'Chat not found');
  deleteCacheValue(`chats:${req.user!.userId}`);
  await Message.deleteMany({ chatId: chat._id });
  res.json({ success: true, data: null, error: null });
};
