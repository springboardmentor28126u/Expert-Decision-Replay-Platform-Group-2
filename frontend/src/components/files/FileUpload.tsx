import React, { useState, useRef } from 'react';
import Button from '../common/Button';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
  maxSizeMb?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, loading, maxSizeMb = 10 }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File exceeds the maximum size limit of ${maxSizeMb}MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError('File upload failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleUploadSubmit} className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            id="file-upload-input"
          />
          <div className="input-field flex items-center justify-between text-text-secondary cursor-pointer">
            <span className="truncate">
              {selectedFile ? selectedFile.name : 'Select file to upload...'}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-text-muted shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!selectedFile}
          loading={loading}
        >
          Upload
        </Button>
      </div>

      <div className="flex justify-between items-center text-[10px] text-text-muted px-1">
        <span>Max file size: {maxSizeMb}MB</span>
        {error && <span className="text-error font-semibold">{error}</span>}
      </div>
    </form>
  );
};

export default FileUpload;
