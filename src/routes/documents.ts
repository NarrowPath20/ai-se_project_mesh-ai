import { Router } from 'express';
import multer from 'multer';
import {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/documents.js';
import { auth } from '../middleware/auth.js';
export const documentsRouter = Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});
documentsRouter.use(auth);
documentsRouter.get('/', getDocuments);
documentsRouter.post('/', upload.single('file'), uploadDocument);
documentsRouter.get('/:id', getDocument);
documentsRouter.patch('/:id', updateDocument);
documentsRouter.delete('/:id', deleteDocument);
