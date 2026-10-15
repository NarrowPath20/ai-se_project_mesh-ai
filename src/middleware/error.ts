import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { HttpError } from '../utils/http-error.js';
export const notFoundHandler: RequestHandler = (req, res): void => {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: 'Route ' + req.method + ' ' + req.path + ' not found' },
  });
};
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }
  let status = 500;
  let message = 'An error has occurred on the server';
  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
  } else if (error instanceof SyntaxError && 'body' in error) {
    status = 400;
    message = 'Invalid JSON request body';
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid resource ID';
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Invalid resource data';
  } else if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.message;
  } else if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    status = 409;
    message = 'User already exists';
  }
  if (status === 500) console.error(error);
  res.status(status).json({ success: false, data: null, error: { message } });
};
