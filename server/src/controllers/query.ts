import type { RequestHandler } from 'express';
import { answerQuestion } from '../utils/rag.js';
import { HttpError, requiredText } from '../utils/http-error.js';
export const queryDocuments: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  const { question } = req.body ?? {};
  if (!requiredText(question)) throw new HttpError(400, 'question is required');
  res.json({
    success: true,
    data: await answerQuestion(req.user!.userId, question),
    error: null,
  });
};
