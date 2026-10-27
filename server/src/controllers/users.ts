import type { Request, Response } from 'express';
import User from '../models/user.js';
import { HttpError } from '../utils/http-error.js';

export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await User.findById(req.user!.userId).select('-password');
  if (!user) throw new HttpError(404, 'User not found');

  res.status(200).json({
    success: true,
    data: { userId: user._id, name: user.name, email: user.email },
    error: null,
  });
};
