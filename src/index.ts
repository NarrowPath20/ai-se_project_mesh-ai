import 'dotenv/config';
import mongoose from 'mongoose';
import { app } from './app.js';

const port = process.env.PORT || 3000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error('MONGO_URI and JWT_SECRET must be configured');
}
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((error: unknown) => {
    console.error('Connection error', error);
    process.exitCode = 1;
  });
