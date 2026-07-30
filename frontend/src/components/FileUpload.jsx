import { useState } from "react";
import API from "../services/api";
import "../styles/Files.css";
function FileUpload({ decisionId, onUploadSuccess }) {

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {

    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {

      await API.post(
        `/files/upload/${decisionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("File uploaded successfully.");

      setSelectedFile(null);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {

      console.log(error);

      alert("File upload failed.");

    }

  };

  return (

    <div style={{ marginBottom: "20px" }}>

      <h3>Upload Document</h3>

      <input
        type="file"
        onChange={handleFileChange}
      />

      <br /><br />

      <button onClick={handleUpload} className="upload-btn">
        Upload File
      </button>

    </div>

  );

}

export default FileUpload;