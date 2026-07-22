import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

function DecisionList() {
  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/decisions/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDecisions(response.data);
    } catch (error) {
        console.log(error);
        console.log(error.response);
        alert(error.response?.data?.detail || error.message);
}
  };

  return (
    <Layout>

      <h2 className="mb-4">Decision Management</h2>

      <div className="card shadow">

        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">All Decisions</h5>
        </div>

        <div className="card-body">

          <table className="table table-hover table-bordered">

            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created By</th>
              </tr>
            </thead>

            <tbody>

              {decisions.length > 0 ? (
                decisions.map((decision) => (
                  <tr key={decision.id}>
                    <td>{decision.id}</td>
                    <td>
                    <Link to={`/decision/${decision.id}`}>
                        {decision.title}
                    </Link>
                    </td>
                    <td>{decision.category}</td>
                    <td>
                      <span className="badge bg-success">
                        {decision.status}
                      </span>
                    </td>
                    <td>{decision.created_by}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No Decisions Found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </Layout>
  );
}

export default DecisionList;