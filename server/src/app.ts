import express from 'express';
import router from './routes/index.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

export const app = express();

app.use(logger);
app.use(express.json());

app.get('/health', (_req, res): void => {
  res.status(200).json({ success: true, data: { status: 'ok' }, error: null });
});

app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);
