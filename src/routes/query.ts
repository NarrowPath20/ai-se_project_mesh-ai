import { Router } from 'express';
import { queryDocuments } from '../controllers/query.js';
import { auth } from '../middleware/auth.js';
export const queryRouter = Router();
queryRouter.use(auth);
queryRouter.post('/', queryDocuments);
