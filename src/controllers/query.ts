import type { RequestHandler } from 'express';

export const createQuery: RequestHandler = (_req, res): void => {
  res.status(201).json({
    success: true,
    data: {
      queryId: 'query_001',
      answer: 'This is a stub answer from your uploaded document.',
      sources: [{ documentId: 'document_001', page: 1 }],
    },
    error: null,
  });
};
