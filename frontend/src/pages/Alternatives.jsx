import { useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import {
  FaBalanceScale,
  FaPlusCircle,
  FaSearch,
  FaThumbsUp,
  FaThumbsDown,
  FaRupeeSign,
  FaTasks,
} from "react-icons/fa";

function Alternatives() {
  const [decisionId, setDecisionId] = useState("");
  const [option_name, setOptionName] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [estimated_cost, setEstimatedCost] = useState("");
  const [feasibility, setFeasibility] = useState("");
  const [risk_level, setRiskLevel] = useState("");

  const [alternatives, setAlternatives] = useState([]);

  const fetchAlternatives = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get(
        `/alternatives/${decisionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAlternatives(response.data);

    } catch (err) {
      alert("Failed to load alternatives");
    }
  };

  const createAlternative = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/alternatives/${decisionId}`,
        {
          option_name,
          pros,
          cons,
          estimated_cost: Number(estimated_cost),
          feasibility,
          risk_level,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Alternative Added");

      setOptionName("");
      setPros("");
      setCons("");
      setEstimatedCost("");
      setFeasibility("");
      setRiskLevel("");

      fetchAlternatives();

    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.detail || "Failed");
    }
  };

  const getRiskBadge = (risk) => {
    switch ((risk || "").toLowerCase()) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "secondary";
    }
  };

  const cardStyle = {
    borderRadius: "18px",
    border: "none",
    boxShadow: "0 8px 25px rgba(0,0,0,.08)",
  };

  return (
    <Layout>
      <div className="container-fluid py-4">

        <div className="d-flex align-items-center mb-4">
          <FaBalanceScale size={26} className="me-2" style={{ color: "#2563eb" }} />
          <h2 className="fw-bold mb-0">Alternatives</h2>
        </div>

        {/* Load Alternatives */}

        <div className="card mb-4" style={cardStyle}>
          <div className="card-body">

            <h5 className="fw-bold mb-3">Load Alternatives</h5>

            <div className="input-group">
              <span className="input-group-text">
                <FaSearch />
              </span>

              <input
                className="form-control"
                placeholder="Enter Decision ID"
                value={decisionId}
                onChange={(e) => setDecisionId(e.target.value)}
              />

              <button
                className="btn btn-primary"
                onClick={fetchAlternatives}
              >
                Load
              </button>
            </div>

          </div>
        </div>

        {/* Add Alternative Form */}

        <div className="card mb-4" style={cardStyle}>
          <div className="card-body">

            <h5 className="fw-bold mb-4">Add New Alternative</h5>

            <form onSubmit={createAlternative}>

              <div className="row g-3">

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Option Name</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Cloud Migration"
                    value={option_name}
                    onChange={(e) => setOptionName(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">Estimated Cost</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 50000"
                    value={estimated_cost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">Feasibility</label>
                  <input
                    className="form-control"
                    placeholder="e.g. High"
                    value={feasibility}
                    onChange={(e) => setFeasibility(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Pros</label>
                  <textarea
                    className="form-control"
                    placeholder="Advantages of this option"
                    rows={2}
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Cons</label>
                  <textarea
                    className="form-control"
                    placeholder="Drawbacks of this option"
                    rows={2}
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Risk Level</label>
                  <select
                    className="form-select"
                    value={risk_level}
                    onChange={(e) => setRiskLevel(e.target.value)}
                  >
                    <option value="">Select Risk Level</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

              </div>

              <button className="btn btn-success mt-4">
                <FaPlusCircle className="me-2" />
                Add Alternative
              </button>

            </form>

          </div>
        </div>

        {/* Existing Alternatives */}

        <div className="card" style={cardStyle}>
          <div className="card-body">

            <h5 className="fw-bold mb-4">Existing Alternatives</h5>

            <div className="table-responsive">

              <table className="table table-hover align-middle">

                <thead className="table-light">
                  <tr>
                    <th>Option</th>
                    <th><FaThumbsUp className="me-1 text-success" />Pros</th>
                    <th><FaThumbsDown className="me-1 text-danger" />Cons</th>
                    <th><FaRupeeSign className="me-1" />Cost</th>
                    <th><FaTasks className="me-1" />Feasibility</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>

                  {alternatives.length > 0 ? (
                    alternatives.map((alt) => (
                      <tr key={alt.id}>
                        <td className="fw-semibold">{alt.option_name}</td>
                        <td>{alt.pros}</td>
                        <td>{alt.cons}</td>
                        <td>{alt.estimated_cost}</td>
                        <td>{alt.feasibility}</td>
                        <td>
                          <span className={`badge bg-${getRiskBadge(alt.risk_level)}`}>
                            {alt.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        No Alternatives Found
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

export default Alternatives;