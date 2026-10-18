import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { HttpError } from '../utils/http-error.js';
export const auth: RequestHandler = (req, _res, next): void => {
  const header = req.get('Authorization');
  if (!header?.startsWith('Bearer ') || !header.slice(7).trim()) {
    next(
      new HttpError(
        401,
        'An authorization token is required. Use Authorization: Bearer <token>.',
      ),
    );
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!);
    if (
      typeof payload === 'string' ||
      typeof payload.userId !== 'string' ||
      !mongoose.isValidObjectId(payload.userId)
    )
      throw new Error('Invalid payload');
    req.user = { userId: payload.userId };
    next();
  } catch {
    next(new HttpError(401, 'Invalid token'));
  }
};
