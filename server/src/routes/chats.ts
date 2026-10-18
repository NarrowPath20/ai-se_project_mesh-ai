import { Router } from 'express';
import {
  getChats,
  getChat,
  createChat,
  updateChat,
  deleteChat,
} from '../controllers/chats.js';
import { createMessage } from '../controllers/messages.js';
import { auth } from '../middleware/auth.js';
export const chatsRouter = Router();
chatsRouter.use(auth);
chatsRouter.get('/', getChats);
chatsRouter.post('/', createChat);
chatsRouter.get('/:id', getChat);
chatsRouter.patch('/:id', updateChat);
chatsRouter.delete('/:id', deleteChat);
chatsRouter.post('/:id/messages', createMessage);
