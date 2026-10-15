import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
export const auth: RequestHandler = (req, res, next): void => {
  try {
    const header = req.get('Authorization');
    if (!header?.startsWith('Bearer ')) throw new Error('Missing token');
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
    res
      .status(401)
      .json({ success: false, data: null, error: { message: 'Unauthorized' } });
  }
};
