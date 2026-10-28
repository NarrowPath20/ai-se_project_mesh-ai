import { useEffect, useState } from 'react';
import UploadArea from '../../components/UploadArea/UploadArea';
import { deleteDocument, getDocuments, uploadDocument } from '../../utils/api';
import type { KnowledgeDoc } from '../../utils/api';
import './KnowledgeBase.css';
import closeIcon from '../../assets/close.svg';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getDocuments();
        if (!res.success)
          throw new Error(res.error?.message || 'Failed to load documents.');
        if (active)
          setDocuments((current) => [
            ...current,
            ...(res.data || []).filter(
              (doc) => !current.some((existing) => existing._id === doc._id),
            ),
          ]);
      } catch {
        if (active) setError('Failed to load documents.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    if (isUploading) return;
    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadDocument(file);
      if (!res.success || !res.data)
        throw new Error(res.error?.message || 'Failed to upload document.');
      const newDoc = res.data;
      setDocuments((current) => [
        newDoc,
        ...current.filter((doc) => doc._id !== newDoc._id),
      ]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to upload document.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (deletingIds.includes(documentId)) return;
    setDeletingIds((current) => [...current, documentId]);
    setError(null);
    try {
      const res = await deleteDocument(documentId);
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to delete document.');
      }
      setDocuments((current) =>
        current.filter((doc) => doc._id !== documentId),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete document.',
      );
    } finally {
      setDeletingIds((current) => current.filter((id) => id !== documentId));
    }
  };

  return (
    <div className="knowledge-base">
      <h1 className="knowledge-base__heading">Manage Your Knowledge Base</h1>
      <section
        className="knowledge-base__content"
        aria-label="Knowledge base documents"
      >
        <p className="knowledge-base__label">Upload documents (PDF)</p>
        <UploadArea onFileSelect={handleFileSelect} isUploading={isUploading} />
        <div
          className="knowledge-base__library"
          aria-busy={isLoading}
          aria-live="polite"
        >
          {isLoading && (
            <p className="knowledge-base__status" role="status">
              Loading documents…
            </p>
          )}
          {!isLoading && error && (
            <p
              className="knowledge-base__status knowledge-base__status_error"
              role="alert"
            >
              {error}
            </p>
          )}
          {!isLoading && !error && documents.length === 0 && (
            <p className="knowledge-base__status">No documents yet.</p>
          )}
          {documents.length > 0 && (
            <ul className="knowledge-base__documents">
              {documents.map((doc) => (
                <li className="knowledge-base__document" key={doc._id}>
                  <span
                    className="knowledge-base__filename"
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </span>
                  <button
                    className="knowledge-base__delete"
                    type="button"
                    aria-label={`Delete ${doc.fileName}`}
                    disabled={isLoading || deletingIds.includes(doc._id)}
                    aria-busy={deletingIds.includes(doc._id)}
                    onClick={() => void handleDelete(doc._id)}
                  >
                    <img src={closeIcon} alt="" width="16" height="16" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
