import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/documents.js';

export const documentsRouter = Router();

documentsRouter.get('/', listDocuments);
documentsRouter.post('/', createDocument);
documentsRouter.get('/:documentId', getDocument);
documentsRouter.patch('/:documentId', updateDocument);
documentsRouter.delete('/:documentId', deleteDocument);
