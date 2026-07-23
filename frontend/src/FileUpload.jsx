import React, { useState } from 'react';

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

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
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await fetch("http://localhost:8000/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }
      const data = await response.json();
      setSelectedFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(data.file_url);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <div className="form-file-input-wrapper">
        <label htmlFor="file-input" className="form-file-label">
          📎 Attach File
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
            >
              ✕
            </button>
          </span>
        )}
      </div>
      {selectedFile && (
        <button
          type="button"
          className="form-btn primary"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      )}
      {error && <div className="auth-message error">{error}</div>}
    </div>
  );
};

export default FileUpload;