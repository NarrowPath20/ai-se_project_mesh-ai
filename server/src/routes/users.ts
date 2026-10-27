import { Router } from 'express';
import { getCurrentUser } from '../controllers/users.js';
import { auth } from '../middleware/auth.js';

const usersRouter = Router();
usersRouter.use(auth);
usersRouter.get('/me', getCurrentUser);

export { usersRouter };
