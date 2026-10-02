import type { RequestHandler } from 'express';

const user = {
  userId: 'user_001',
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: '2026-01-01T00:00:00Z',
};

export const getCurrentUser: RequestHandler = (_req, res): void => {
  res.status(200).json({ success: true, data: user, error: null });
};

export const register: RequestHandler = (_req, res): void => {
  res.status(201).json({ success: true, data: { user }, error: null });
};

export const login: RequestHandler = (_req, res): void => {
  res.status(200).json({
    success: true,
    data: { user, token: 'stub-token' },
    error: null,
  });
};

export const logout: RequestHandler = (_req, res): void => {
  res.status(200).json({ success: true, data: {}, error: null });
};
