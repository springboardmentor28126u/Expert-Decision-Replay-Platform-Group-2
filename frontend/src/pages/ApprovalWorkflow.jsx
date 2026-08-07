import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

const TABS = {
  ASSIGN: "assign",
  MINE: "mine",
  ALL: "all",
};

function ApprovalWorkflow() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.MINE);
  const [loading, setLoading] = useState(true);

  const [decisions, setDecisions] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState("");
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("1");

  const [myApprovals, setMyApprovals] = useState([]);
  const [allApprovals, setAllApprovals] = useState([]);

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [remarks, setRemarks] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const isManager = user && ["Manager", "Administrator"].includes(user.role);

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      const userRes = await api.get("/me", { headers });
      setUser(userRes.data);

      const managerRole = ["Manager", "Administrator"].includes(userRes.data.role);

      if (managerRole) {
        // Manager/Administrator never review, so default to Assign Reviewer
        setActiveTab(TABS.ASSIGN);
        await loadAllApprovals();
        await loadDecisionsAndReviewers();
      } else {
        setActiveTab(TABS.MINE);
        await loadMyApprovals();
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMyApprovals = async () => {
    const res = await api.get("/approvals/my", { headers });
    setMyApprovals(res.data);
  };

  const loadAllApprovals = async () => {
    const res = await api.get("/approvals/", { headers });
    setAllApprovals(res.data);
  };

  const loadDecisionsAndReviewers = async () => {
    const [decisionsRes, reviewersRes] = await Promise.all([
      api.get("/decisions/", { headers }),
      api.get("/approvals/reviewers", { headers }),
    ]);
    setDecisions(decisionsRes.data);
    setReviewers(reviewersRes.data);
  };

  const handleAssignReviewer = async () => {
    if (!selectedDecision || !selectedReviewer) {
      alert("Please select a decision and a reviewer.");
      return;
    }
    try {
      await api.post("/approvals/assign", null, {
        headers,
        params: {
          decision_id: selectedDecision,
          reviewer_id: selectedReviewer,
          level: selectedLevel,
        },
      });
      setSelectedDecision("");
      setSelectedReviewer("");
      setSelectedLevel("1");
      await loadAllApprovals();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || error.message);
    }
  };

  const handleDecide = async (status) => {
    if (!selectedApproval) return;
    try {
      await api.put(
        `/approvals/${selectedApproval.approval_id}/decide`,
        null,
        { headers, params: { status, remarks } }
      );
      setSelectedApproval(null);
      setRemarks("");
      await loadMyApprovals();
      if (isManager) await loadAllApprovals();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || error.message);
    }
  };

  const getBadge = (status) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Rejected":
        return "danger";
      case "Pending":
        return "warning";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid">Loading...</div>
      </Layout>
    );
  }

  // ---- Detail view ----
  if (selectedApproval) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">{selectedApproval.decision_title}</h2>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setSelectedApproval(null);
                setRemarks("");
              }}
            >
              &larr; Back to Approval List
            </button>
          </div>

          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Decision Details</h5>
            </div>
            <div className="card-body">
              <p><strong>Level:</strong> {selectedApproval.level}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`badge bg-${getBadge(selectedApproval.status)}`}>
                  {selectedApproval.status}
                </span>
              </p>

              <div className="mb-3">
                <label className="form-label fw-semibold">Comments</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remarks"
                />
              </div>

              {selectedApproval.status === "Pending" && (
                <>
                  <button
                    className="btn btn-success me-2"
                    onClick={() => handleDecide("Approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDecide("Rejected")}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ---- Main tabbed view ----
  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Approval Workflow</h2>
        </div>

        <ul className="nav nav-tabs mb-4">
          {isManager && (
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === TABS.ASSIGN ? "active" : ""}`}
                onClick={() => setActiveTab(TABS.ASSIGN)}
              >
                Assign Reviewer
              </button>
            </li>
          )}

          {!isManager && (
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === TABS.MINE ? "active" : ""}`}
                onClick={() => setActiveTab(TABS.MINE)}
              >
                My Approvals
              </button>
            </li>
          )}

          {isManager && (
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === TABS.ALL ? "active" : ""}`}
                onClick={() => setActiveTab(TABS.ALL)}
              >
                All Approvals
              </button>
            </li>
          )}
        </ul>

        {/* Assign Reviewer */}
        {activeTab === TABS.ASSIGN && isManager && (
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Assign Reviewer</h5>
            </div>
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label">Decision</label>
                  <select
                    className="form-select"
                    value={selectedDecision}
                    onChange={(e) => setSelectedDecision(e.target.value)}
                  >
                    <option value="">Select Decision</option>
                    {decisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Reviewer</label>
                  <select
                    className="form-select"
                    value={selectedReviewer}
                    onChange={(e) => setSelectedReviewer(e.target.value)}
                  >
                    <option value="">Select Reviewer</option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>{r.full_name} ({r.role})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Level</label>
                  <select
                    className="form-select"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  >
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-primary w-100" onClick={handleAssignReviewer}>
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Approvals */}
        {activeTab === TABS.MINE && !isManager && (
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Approvals</h5>
              <small>Showing {myApprovals.length}</small>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Decision</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myApprovals.length > 0 ? (
                      myApprovals.map((a) => (
                        <tr key={a.approval_id}>
                          <td className="fw-semibold">{a.decision_title}</td>
                          <td>Level {a.level}</td>
                          <td>
                            <span className={`badge bg-${getBadge(a.status)}`}>
                              {a.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setSelectedApproval(a)}
                            >
                              {a.status === "Pending" ? "Approve | Reject" : "View"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          No approvals pending for you
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* All Approvals */}
        {activeTab === TABS.ALL && isManager && (
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">All Approvals</h5>
              <small>Showing {allApprovals.length}</small>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Decision</th>
                      <th>Reviewer</th>
                      <th>Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allApprovals.length > 0 ? (
                      allApprovals.map((a) => (
                        <tr
                          key={a.approval_id}
                          onClick={() => setSelectedApproval(a)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="fw-semibold">{a.decision_title}</td>
                          <td>{a.reviewer_name || "-"}</td>
                          <td>Level {a.level}</td>
                          <td>
                            <span className={`badge bg-${getBadge(a.status)}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          No approvals found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ApprovalWorkflow;