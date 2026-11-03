import { auth } from '../middleware/auth.js';
import { Router } from 'express';
import { getCurrentUser, register, login } from '../controllers/auth.js';
import { createAuthLimiter } from '../middleware/rate-limit.js';

export const authRouter = Router();

authRouter.get('/me', auth, getCurrentUser);
authRouter.post('/register', createAuthLimiter(), register);
authRouter.post('/login', createAuthLimiter(), login);
