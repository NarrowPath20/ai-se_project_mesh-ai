import { Router } from 'express';
import {
  listChats,
  getChat,
  createChat,
  updateChat,
  deleteChat,
} from '../controllers/chats.js';

export const chatsRouter = Router();

chatsRouter.get('/', listChats);
chatsRouter.post('/', createChat);
chatsRouter.get('/:chatId', getChat);
chatsRouter.patch('/:chatId', updateChat);
chatsRouter.delete('/:chatId', deleteChat);
