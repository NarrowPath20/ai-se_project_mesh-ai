import type { RequestHandler } from 'express';
import { readFile, unlink } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import Document from '../models/document.js';
import Chunk from '../models/chunk.js';
import { HttpError, requiredText } from '../utils/http-error.js';
import { chunkText } from '../utils/chunk.js';
import { createEmbedding } from '../utils/embeddings.js';
export const uploadDocument: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  if (!req.file) throw new HttpError(400, 'A PDF file is required');
  try {
    const data = await readFile(req.file.path);
    if (!data.subarray(0, 1024).includes(Buffer.from('%PDF-')))
      throw new HttpError(400, 'A valid PDF file is required');
    const parser = new PDFParse({ data });
    let text: string;
    try {
      text = (await parser.getText()).text;
    } catch {
      throw new HttpError(400, 'Unable to extract PDF text');
    } finally {
      await parser.destroy();
    }
    if (!text.trim())
      throw new HttpError(400, 'PDF contains no extractable text');
    const chunks: { text: string; embedding: number[] }[] = [];
    // Process sequentially to avoid overwhelming the embedding API on large PDFs.
    for (const piece of chunkText(text))
      chunks.push({ text: piece, embedding: await createEmbedding(piece) });
    const document = await Document.create({
      title: requiredText(req.body?.title)
        ? req.body.title
        : req.file.originalname,
      fileName: req.file.originalname,
      userId: req.user!.userId,
    });
    try {
      await Chunk.insertMany(
        chunks.map((chunk) => ({ ...chunk, documentId: document._id })),
      );
    } catch (error) {
      await Chunk.deleteMany({ documentId: document._id });
      await Document.deleteOne({ _id: document._id });
      throw error;
    }
    res.status(201).json({ success: true, data: document, error: null });
  } finally {
    await unlink(req.file.path).catch(() => undefined);
  }
};
export const getDocuments: RequestHandler = async (req, res): Promise<void> => {
  res.json({
    success: true,
    data: await Document.find({ userId: req.user!.userId }),
    error: null,
  });
};
export const getDocument: RequestHandler = async (req, res): Promise<void> => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user!.userId,
  });
  if (!document) throw new HttpError(404, 'Document not found');
  res.json({ success: true, data: document, error: null });
};
export const updateDocument: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  if (!requiredText(req.body?.title))
    throw new HttpError(400, 'title is required');
  const document = await Document.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    { title: req.body.title },
    { new: true, runValidators: true },
  );
  if (!document) throw new HttpError(404, 'Document not found');
  res.json({ success: true, data: document, error: null });
};
export const deleteDocument: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  const document = await Document.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.userId,
  });
  if (!document) throw new HttpError(404, 'Document not found');
  await Chunk.deleteMany({ documentId: document._id });
  res.json({ success: true, data: null, error: null });
};
