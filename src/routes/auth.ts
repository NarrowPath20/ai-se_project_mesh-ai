import { Router } from 'express';
import {
  getCurrentUser,
  register,
  login,
  logout,
} from '../controllers/auth.js';

export const authRouter = Router();

authRouter.get('/me', getCurrentUser);
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
