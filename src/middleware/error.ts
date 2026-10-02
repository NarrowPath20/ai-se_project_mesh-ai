import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, res): void => {
  res.status(404).json({
    success: false,
    data: null,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
): void => {
  console.error(error);
  if (res.headersSent) {
    next(error);
    return;
  }
  const malformedJson = error instanceof SyntaxError && 'body' in error;
  res.status(malformedJson ? 400 : 500).json({
    success: false,
    data: null,
    error: malformedJson
      ? 'Invalid JSON request body'
      : 'An error has occurred on the server',
  });
};
