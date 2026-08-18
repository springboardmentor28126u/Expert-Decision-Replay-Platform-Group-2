import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function DecisionHistory() {
  const { id } = useParams();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await api.get(`/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHistory(res.data);
    } catch (err) {
      console.log(err.response);
      alert("Failed to load history");
    }
  };

  return (
    <Layout>
      <div className="container">
        <h2 className="mb-4">Decision History</h2>

        {history.length === 0 ? (
          <div className="alert alert-info">
            No History Available
          </div>
        ) : (
          history.map((item, index) => (
            <div className="card shadow mb-3" key={item.id}>
              <div className="card-body">
                <h5>Version {history.length - index}</h5>

                <p><strong>Title:</strong> {item.title}</p>

                <p><strong>Description:</strong> {item.description}</p>

                <p><strong>Category:</strong> {item.category}</p>

                <p><strong>Status:</strong> {item.status}</p>

                <p>
                  <strong>Updated At:</strong>{" "}
                  {new Date(item.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}

export default DecisionHistory;
