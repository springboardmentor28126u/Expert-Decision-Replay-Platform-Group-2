import { useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

function CreateDecision() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const createDecision = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const response = await api.post(
        "/decisions/",
        {
          title,
          description,
          category,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("✅ Decision Created Successfully!");

      console.log(response.data);

      setTitle("");
      setDescription("");
      setCategory("");

    } catch (err) {
      console.log(err.response);
      alert("Failed to create decision");
    }
  };

  return (
    <Layout>
      <div className="container-fluid d-flex justify-content-center">
        <div style={{ width: "100%", maxWidth: "650px" }}>
          <h2 className="fw-bold mb-4 text-center">Create New Decision</h2>

          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Decision Information</h5>
            </div>

            <div className="card-body p-4">
              <form onSubmit={createDecision}>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Title
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter decision title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Description
                  </label>

                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Enter detailed description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Category
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Example: AI, Cloud, Database"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>

                <button
                  className="btn btn-primary w-100"
                >
                  Create Decision
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CreateDecision;