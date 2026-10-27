// A fresh backend process reads the integration test's isolated database.
import mongoose from 'mongoose';
import { app } from '../dist/app.js';

await mongoose.connect(
  process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/meshai_test',
  {
    dbName: process.env.TEST_DB_NAME,
    serverSelectionTimeoutMS: 5000,
  },
);
const server = app.listen(0, '127.0.0.1', () => {
  process.send({ port: server.address().port });
});
