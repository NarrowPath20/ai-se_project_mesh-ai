import type { RequestHandler } from 'express';

const document = {
  documentId: 'document_001',
  filename: 'demo.pdf',
  status: 'ready',
  createdAt: '2026-01-01T00:00:00Z',
};

export const listDocuments: RequestHandler = (_req, res): void => {
  res
    .status(200)
    .json({ success: true, data: { documents: [document] }, error: null });
};

export const getDocument: RequestHandler = (req, res): void => {
  res.status(200).json({
    success: true,
    data: { ...document, documentId: req.params.documentId },
    error: null,
  });
};

export const createDocument: RequestHandler = (_req, res): void => {
  res.status(201).json({ success: true, data: document, error: null });
};

export const updateDocument: RequestHandler = (req, res): void => {
  res.status(200).json({
    success: true,
    data: { ...document, documentId: req.params.documentId },
    error: null,
  });
};

export const deleteDocument: RequestHandler = (_req, res): void => {
  res.status(204).send();
};
