import { useState, useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import apiClient from '../api/client';
import Button from './ui/Button';

const FileUpload = ({ token, targetType, targetId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const uploadingRef = useRef(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5 MB.");
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || uploadingRef.current || !targetType || !targetId) return;
    uploadingRef.current = true;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await apiClient.post(
        `/api/v1/attachments/${targetType}/${targetId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSelectedFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
      uploadingRef.current = false;
    }
  };

  return (
    <div className="file-upload-container">
      <div className="form-file-input-wrapper">
        <label htmlFor="file-input" className="form-file-label">
          <Paperclip size={13} strokeWidth={2} aria-hidden="true" />
          Attach File
        </label>
        <input
          id="file-input"
          type="file"
          className="form-file-input"
          onChange={handleFileChange}
        />
        {selectedFile && (
          <span className="form-selected-file">
            {selectedFile.name}
            <button
              type="button"
              className="message-action-btn delete"
              onClick={() => setSelectedFile(null)}
              aria-label={`Remove selected file ${selectedFile.name}`}
            >
              <X size={12} strokeWidth={2} aria-hidden="true" />
            </button>
          </span>
        )}
      </div>
      {selectedFile && (
        <Button type="button" variant="primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
      )}
      {error && <div className="auth-message error">{error}</div>}
    </div>
  );
};

export default FileUpload;
