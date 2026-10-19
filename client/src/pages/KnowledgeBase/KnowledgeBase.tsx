import { useEffect, useState } from 'react';
import UploadArea from '../../components/UploadArea/UploadArea';
import { getDocuments } from '../../utils/api';
import type { KnowledgeDoc } from '../../utils/api';
import './KnowledgeBase.css';
import closeIcon from '../../assets/close.svg';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getDocuments();
        if (!res.success) throw new Error(res.error?.message || 'Failed to load documents.');
        if (active) setDocuments((current) => [...current, ...(res.data || [])]);
      } catch {
        if (active) setError('Failed to load documents.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const handleFileSelect = (file: File) => {
    const newDoc: KnowledgeDoc = {
      _id: crypto.randomUUID(),
      title: file.name,
      fileName: file.name,
      userId: 'local',
      createdAt: new Date().toISOString(),
    };
    setDocuments((current) => [newDoc, ...current]);
  };

  return (
    <div className="knowledge-base">
      <h1 className="knowledge-base__heading">Manage Your Knowledge Base</h1>
      <section className="knowledge-base__content" aria-label="Knowledge base documents">
        <p className="knowledge-base__label">Upload documents (PDF)</p>
        <UploadArea onFileSelect={handleFileSelect} />
        <div className="knowledge-base__library" aria-busy={isLoading} aria-live="polite">
          {isLoading && <p className="knowledge-base__status" role="status">Loading documents…</p>}
          {!isLoading && error && <p className="knowledge-base__status knowledge-base__status_error" role="alert">{error}</p>}
          {!isLoading && !error && documents.length === 0 && <p className="knowledge-base__status">No documents yet.</p>}
          {documents.length > 0 && (
            <ul className="knowledge-base__documents">
              {documents.map((doc) => (
                <li className="knowledge-base__document" key={doc._id}>
                  <span className="knowledge-base__filename" title={doc.fileName}>{doc.fileName}</span>
                  <button className="knowledge-base__delete" type="button" aria-label={`Delete ${doc.title}`}>
                    <img src={closeIcon} alt="" width="16" height="16" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="knowledge-base__save" type="button">Save</button>
      </section>
    </div>
  );
}
