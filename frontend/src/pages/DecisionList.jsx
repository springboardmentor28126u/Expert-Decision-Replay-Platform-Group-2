import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaFilter } from "react-icons/fa";

function DecisionList() {
  const navigate = useNavigate();

  const [decisions, setDecisions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const token = sessionStorage.getItem("token");

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

  // Unique category list for the filter dropdown
  const categories = [
    "All",
    ...new Set(decisions.map((d) => d.category).filter(Boolean)),
  ];

  const filteredDecisions = decisions.filter((decision) => {
    const matchesSearch =
      decision.title.toLowerCase().includes(search.toLowerCase()) ||
      decision.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || decision.status === statusFilter;

    const matchesCategory =
      categoryFilter === "All" || decision.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

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

          <button
            className="btn btn-primary"
            onClick={() => navigate("/create")}
          >
            + Create Decision
          </button>
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

                <div className="row g-2">

                  <div className="col-md-6">
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

                  <div className="col-md-3">
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaFilter />
                      </span>

                      <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="All">All Status</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "All" ? "All Categories" : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>

        <div className="card shadow border-0">

          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">All Decisions</h5>
            <small>
              Showing {filteredDecisions.length} of {decisions.length}
            </small>
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
                  </tr>
                </thead>

                <tbody>

                  {filteredDecisions.length > 0 ? (
                    filteredDecisions.map((decision) => (
                      <tr
                        key={decision.id}
                        onClick={() => navigate(`/decision/${decision.id}`)}
                        style={{ cursor: "pointer" }}
                      >

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

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
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
