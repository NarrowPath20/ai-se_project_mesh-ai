import { auth } from '../middleware/auth.js';
import { Router } from 'express';
import { getCurrentUser, register, login } from '../controllers/auth.js';

export const authRouter = Router();

authRouter.get('/me', auth, getCurrentUser);
authRouter.post('/register', register);
authRouter.post('/login', login);
