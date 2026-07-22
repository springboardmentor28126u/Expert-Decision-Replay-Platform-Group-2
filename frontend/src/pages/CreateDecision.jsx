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

      <h2 className="mb-4">Create New Decision</h2>

      <div className="card shadow">

        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Decision Information</h5>
        </div>

        <div className="card-body">

          <form onSubmit={createDecision}>

            <div className="mb-3">
              <label className="form-label">
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
              <label className="form-label">
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
              <label className="form-label">
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
              className="btn btn-success w-100"
            >
              Create Decision
            </button>

          </form>

        </div>

      </div>

    </Layout>
  );
}

export default CreateDecision;