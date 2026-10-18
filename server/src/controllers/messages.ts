import type { RequestHandler } from 'express';
import Chat from '../models/chat.js';
import Message from '../models/message.js';
import { answerQuestion } from '../utils/rag.js';
import { HttpError, requiredText } from '../utils/http-error.js';
export const createMessage: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  const { question } = req.body ?? {};
  if (!requiredText(question)) throw new HttpError(400, 'question is required');
  const chat = await Chat.findOne({
    _id: req.params.id,
    userId: req.user!.userId,
  });
  if (!chat) throw new HttpError(404, 'Chat not found');
  const { answer } = await answerQuestion(req.user!.userId, question);
  const userMessage = await Message.create({
    chatId: chat._id,
    role: 'user',
    content: question,
  });
  try {
    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: answer,
    });
    res.status(201).json({
      success: true,
      data: [userMessage, assistantMessage],
      error: null,
    });
  } catch (error) {
    await Message.deleteOne({ _id: userMessage._id });
    throw error;
  }
};
