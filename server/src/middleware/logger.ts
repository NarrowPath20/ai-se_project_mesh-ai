import morgan from 'morgan';
import { logger as applicationLogger } from '../utils/logger.js';

export const logger = morgan(
  process.env.NODE_ENV === 'development' ? 'dev' : 'combined',
  { stream: { write: (message) => applicationLogger.info(message.trimEnd()) } },
);
