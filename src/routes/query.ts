import { Router } from 'express';
import { createQuery } from '../controllers/query.js';

export const queryRouter = Router();

queryRouter.post('/', createQuery);
