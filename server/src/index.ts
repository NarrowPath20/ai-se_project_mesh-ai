import 'dotenv/config';
import mongoose from 'mongoose';
import { app } from './app.js';
import { logger } from './utils/logger.js';

const port = process.env.PORT || 3000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error('MONGO_URI and JWT_SECRET must be configured');
}
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(port, () => logger.info(`Server running on port ${port}`));
  })
  .catch((error: unknown) => {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    process.exitCode = 1;
  });
