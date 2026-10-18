import type { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { HttpError, requiredText } from '../utils/http-error.js';
const publicUser = (user: { _id: unknown; email: string; name: string }) => ({
  userId: user._id,
  email: user.email,
  name: user.name,
});
export const register: RequestHandler = async (req, res): Promise<void> => {
  const { email, password, name } = req.body ?? {};
  if (!requiredText(email) || !requiredText(password) || !requiredText(name))
    throw new HttpError(400, 'email, password, and name are required');
  if (password.length < 8)
    throw new HttpError(400, 'password must be at least 8 characters');
  const user = await User.create({
    email,
    password: await bcrypt.hash(password, 10),
    name,
  });
  res.status(201).json({ success: true, data: publicUser(user), error: null });
};
export const login: RequestHandler = async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!requiredText(email) || !requiredText(password))
    throw new HttpError(400, 'email and password are required');
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    '+password',
  );
  if (!user || !(await bcrypt.compare(password, user.password)))
    throw new HttpError(401, 'Invalid email or password');
  const token = jwt.sign(
    { userId: String(user._id) },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  );
  res.status(200).json({
    success: true,
    data: { token, user: publicUser(user) },
    error: null,
  });
};
export const getCurrentUser: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  const user = await User.findById(req.user!.userId);
  if (!user)
    throw new HttpError(
      401,
      'The authenticated user no longer exists. Please sign in again.',
    );
  res.json({ success: true, data: publicUser(user), error: null });
};
