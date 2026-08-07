import { useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function UploadDocument() {
  const [decisionId, setDecisionId] = useState("");
  const [file, setFile] = useState(null);

  const uploadFile = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/decisions/${decisionId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(response.data.message);

      setDecisionId("");
      setFile(null);

    } catch (error) {
      console.log(error);
      alert("Upload Failed");
    }
  };

  return (
    <Layout>

      <h2 className="mb-4">Upload Decision Document</h2>

      <div className="card shadow">

        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Upload PDF or Document</h5>
        </div>

        <div className="card-body">

          <form onSubmit={uploadFile}>

            <div className="mb-3">
              <label>Decision ID</label>

              <input
                type="number"
                className="form-control"
                value={decisionId}
                onChange={(e) => setDecisionId(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label>Select File</label>

              <input
                type="file"
                className="form-control"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
            </div>

            <button className="btn btn-primary w-100">
              Upload Document
            </button>

          </form>

        </div>

      </div>

    </Layout>
  );
}

export default UploadDocument;