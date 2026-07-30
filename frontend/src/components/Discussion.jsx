import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/Discussion.css";
function Discussion({ decisionId }) {

  const [comments, setComments] = useState([]);

  const [formData, setFormData] = useState({
    username: "",
    message: "",
  });

  const loadComments = async () => {
    try {
      const response = await API.get(`/discussions/${decisionId}`);
      setComments(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (decisionId) {
      loadComments();
    }
  }, [decisionId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      await API.post("/discussions/", {
        decision_id: Number(decisionId),
        username: formData.username,
        message: formData.message,
      });

      alert("Discussion added successfully.");

      setFormData({
        username: "",
        message: "",
      });

      loadComments();

    } catch (error) {

      console.log(error);

      alert("Unable to add discussion.");

    }
  };

  const handleDelete = async (id) => {

    try {

      await API.delete(`/discussions/${id}`);

      loadComments();

    } catch (error) {

      console.log(error);

    }
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <hr />
<br />
      <h2>Discussions</h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          name="username"
          placeholder="Your Name"
          value={formData.username}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
          }}
        />

        <textarea
          name="message"
          rows="4"
          placeholder="Write your comment..."
          value={formData.message}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
          }}
        />

        <button type="submit" className="post-btn">
          Post Comment
        </button>

      </form>

      {/* <h3 style={{ marginTop: "30px" }}>
        Comments
      </h3>

      {comments.length === 0 ? (

        <p>No discussions yet.</p>

      ) : (

        comments.map((comment) => (

          <div
            key={comment.id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px",
            }}
          >

            <strong>{comment.username}</strong>

            <p>{comment.message}</p>

            <small
              style={{
                color: "#666",
                fontSize: "13px",
              }}
            >
              {new Date(comment.created_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </small>

            <br /><br />

            <button
              onClick={() => handleDelete(comment.id)}
            >
              Delete
            </button>

          </div>

        ))

      )} */}

    </div>

  );

}

export default Discussion;