import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { FaEye, FaSearch } from "react-icons/fa";

function DecisionList() {
  const [decisions, setDecisions] = useState([]);
  const [search, setSearch] = useState("");

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
      alert(error.response?.data?.detail || error.message);
    }
  };

  const filteredDecisions = decisions.filter((decision) =>
    decision.title.toLowerCase().includes(search.toLowerCase()) ||
    decision.category.toLowerCase().includes(search.toLowerCase())
  );

  const getBadge = (status) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Rejected":
        return "danger";
      case "Pending":
        return "warning";
      case "Draft":
        return "secondary";
      default:
        return "primary";
    }
  };

  return (
    <Layout>
      <div className="container-fluid">

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Decision Management</h2>

          <Link to="/create" className="btn btn-primary">
            + Create Decision
          </Link>
        </div>

        <div className="row mb-4">

          <div className="col-md-3">
            <div className="card shadow border-0 bg-primary text-white">
              <div className="card-body text-center">
                <h6>Total Decisions</h6>
                <h2>{decisions.length}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-9">
            <div className="card shadow border-0">
              <div className="card-body">

                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>

                  <input
                    className="form-control"
                    placeholder="Search by title or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

              </div>
            </div>
          </div>

        </div>

        <div className="card shadow border-0">

          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">All Decisions</h5>
          </div>

          <div className="card-body">

            <div className="table-responsive">

              <table className="table table-hover align-middle">

                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredDecisions.length > 0 ? (
                    filteredDecisions.map((decision) => (
                      <tr key={decision.id}>

                        <td>{decision.id}</td>

                        <td className="fw-semibold">
                          {decision.title}
                        </td>

                        <td>{decision.category}</td>

                        <td>
                          <span
                            className={`badge bg-${getBadge(decision.status)}`}
                          >
                            {decision.status}
                          </span>
                        </td>

                        <td>{decision.created_by}</td>

                        <td>
                          <Link
                            to={`/decision/${decision.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <FaEye className="me-1" />
                            View
                          </Link>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        No Decisions Found
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}

export default DecisionList;