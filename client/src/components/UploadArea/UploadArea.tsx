import { useId, useState } from 'react';
import type { DragEvent } from 'react';
import './UploadArea.css';
import uploadIcon from '../../assets/upload.svg';

type Props = { onFileSelect: (file: File) => void | Promise<void>; isUploading: boolean };

export default function UploadArea({ onFileSelect, isUploading }: Props) {
  const id = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (file?: File) => {
    if (!file || isUploading) return;
    if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      setError('Please select a PDF file.');
      return;
    }
    setError(null);
    void onFileSelect(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="upload-area">
      <input className="upload-area__input" id={id} type="file" accept="application/pdf,.pdf"
        disabled={isUploading}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ''; }} />
      <label className={`upload-area__zone${isDragging ? ' upload-area__zone_dragging' : ''}`} htmlFor={id}
        aria-disabled={isUploading} aria-busy={isUploading}
        onDragOver={(event) => { event.preventDefault(); if (!isUploading) setIsDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
        onDrop={handleDrop}>
        <img src={uploadIcon} alt="Upload PDF to the knowledge base" width="24" height="24" />
        {isUploading ? <span role="status">Uploading...</span> : <span className="upload-area__text"><span className="upload-area__desktop-text">Drag’n’Drop or </span><span className="upload-area__browse">Upload</span></span>}
      </label>
      {error && <p className="upload-area__error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
