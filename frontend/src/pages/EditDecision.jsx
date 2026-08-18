import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function EditDecision() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchDecision();
  }, []);

  const fetchDecision = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await api.get(`/decisions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTitle(res.data.title);
      setDescription(res.data.description);
      setCategory(res.data.category);
      setStatus(res.data.status);
    } catch (err) {
      alert("Failed to load decision");
    }
  };

  const updateDecision = async (e) => {
    e.preventDefault();

    try {
      const token = sessionStorage.getItem("token");

      await api.put(
        `/decisions/${id}`,
        {
          title,
          description,
          category,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Decision Updated Successfully");
      navigate(`/decision/${id}`);
    } catch (err) {
      alert("Failed to update decision");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Edit Decision</h2>

      <form onSubmit={updateDecision}>
        <div className="mb-3">
          <label>Title</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Category</label>
          <input
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Status</label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Draft</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>

        <button className="btn btn-primary">
          Update Decision
        </button>
      </form>
    </div>
  );
}

export default EditDecision;
