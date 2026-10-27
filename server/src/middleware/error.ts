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
    message = `Invalid ${error.path}: expected a valid ${error.kind}.`;
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join('; ');
  } else if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'The PDF file exceeds the 20 MiB upload limit.'
        : error.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Upload one PDF using the multipart field named file.'
          : error.message;
  } else if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    status = 409;
    message = 'Email already in use';
  }
  if (status === 500) console.error(error);
  res.status(status).json({ success: false, data: null, error: { message } });
};
