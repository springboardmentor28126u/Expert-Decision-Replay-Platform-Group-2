import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import {
  FaArrowLeft,
  FaInfoCircle,
  FaBalanceScale,
  FaComments,
  FaFileAlt,
  
      const commentRes = await api.get(`/comments/${id}`, { headers });
      setComments(commentRes.data);

      const alternativeRes = await api.get(`/alternatives/${id}`, {
        headers,
      });
      setAlternatives(alternativeRes.data);

      const documentRes = await api.get(`/decisions/${id}/documents`, {
        headers,
      });
      setDocuments(documentRes.data);

      const historyRes = await api.get(
        `/decisions/${id}/history`,
        { headers }
      );
      setHistory(historyRes.data);

      const userRes = await api.get("/me", { headers });
      setUser(userRes.data);

      const aiReviewRes = await api.get(`/decisions/${id}/ai-review`, { headers });
      setAiReviews(aiReviewRes.data);
    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.detail || "Failed to load details");
    }
  };

  const deleteDecision = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this decision?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/decisions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Decision deleted successfully");
      navigate("/decisions");

    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  const approveDecision = async () => {
    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/approvals/${id}?status=Approved`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Decision Approved Successfully");
      loadData();

    } catch (err) {
      alert(err.response?.data?.detail || "Approval failed");
    }
  };

  const rejectDecision = async () => {
    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/approvals/${id}?status=Rejected`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Decision Rejected Successfully");
      loadData();

    } catch (err) {
      alert(err.response?.data?.detail || "Rejection failed");
    }
  };

  const runAIReview = async () => {
    setAiLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await api.post(
        `/decisions/${id}/ai-review`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAiReviews([response.data, ...aiReviews]);

    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.detail || "AI review failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };
  
  const resetAddForm = () => {
    setOptionName("");
    setPros("");
    setCons("");
    setEstimatedCost("");
    setFeasibility("");
    setRiskLevel("");
  };

  const submitAlternative = async (e) => {
    e.preventDefault();

    if (!optionName || !estimatedCost) {
      alert("Please fill in at least Option Name and Estimated Cost");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/alternatives/${id}`,
        {
          option_name: optionName,
          pros,
          cons,
          estimated_cost: String(estimatedCost),
          feasibility,
          risk_level: riskLevel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      resetAddForm();
      setShowAddModal(false);
      loadData();

    } catch (err) {
      console.log(err.response);

      const detail = err.response?.data?.detail;

      let message = "Failed to add alternative";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map((d) => `${d.loc?.[d.loc.length - 1]}: ${d.msg}`)
          .join("\n");
      }

      alert(message);

    } finally {
      setSaving(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setSendingComment(true);

    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/comments/${id}`,
        { comment: newComment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewComment("");
      loadData();

    } catch (err) {
      console.log(err.response);

      const detail = err.response?.data?.detail;

      let message = "Failed to add comment";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map((d) => `${d.loc?.[d.loc.length - 1]}: ${d.msg}`)
          .join("\n");
      }

      alert(message);

    } finally {
      setSendingComment(false);
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/decisions/${id}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(response.data.message || "Document uploaded successfully");

      setFile(null);
      setShowUploadModal(false);
      loadData();

    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.detail || "Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile className="me-2 text-secondary" />;

    const ext = fileName.split(".").pop().toLowerCase();

    if (ext === "pdf") return <FaFilePdf className="me-2 text-danger" />;
    if (ext === "doc" || ext === "docx")
      return <FaFileWord className="me-2 text-primary" />;

    return <FaFile className="me-2 text-secondary" />;
  };

  if (!decision) {
    return (
      <Layout>
        <div className="container mt-5">
          <h3>Loading...</h3>
        </div>
      </Layout>
    );
  }

  const cardStyle = {
    borderRadius: "18px",
    border: "none",
    boxShadow: "0 8px 25px rgba(0,0,0,.08)",
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: <FaInfoCircle className="me-2" /> },
    { key: "alternatives", label: "Alternatives", icon: <FaBalanceScale className="me-2" /> },
    { key: "discussion", label: "Discussion", icon: <FaComments className="me-2" /> },
    { key: "documents", label: "Documents", icon: <FaFileAlt className="me-2" /> },
    { key: "history", label: "Version History", icon: <FaHistory className="me-2" /> },
    { key: "aireview", label: "AI Review", icon: <FaRobot className="me-2" /> },
  ];

  return (
    <Layout>
      <div className="container-fluid py-4">

        {/* Back link */}
        <Link
          to="/decisions"
          className="text-decoration-none d-inline-flex align-items-center mb-3"
          style={{ color: "#2563eb", fontWeight: 600 }}
        >
          <FaArrowLeft className="me-2" />
          Back to Decision List
        </Link>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">

          <div>
            <h2 className="fw-bold mb-1">
              {decision.title}
            </h2>
            <small className="text-muted">
              Decision Details
            </small>
          </div>

          <span
            className={`badge fs-6 ${
              decision.status === "Approved"
                ? "bg-success"
                : decision.status === "Rejected"
                ? "bg-danger"
                : decision.status === "Pending"
                ? "bg-warning text-dark"
                : "bg-secondary"
            }`}
          >
            {decision.status}
          </span>

        </div>

        {/* Tab Navigation */}
        <div
          className="card mb-4"
          style={cardStyle}
        >
          <div className="card-body py-2">
            <ul className="nav nav-pills gap-2 flex-wrap">
              {tabs.map((tab) => (
                <li className="nav-item" key={tab.key}>
                  <button
                    className="nav-link d-flex align-items-center"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      background:
                        activeTab === tab.key ? "#2563eb" : "transparent",
                      color:
                        activeTab === tab.key ? "#fff" : "#374151",
                      fontWeight: activeTab === tab.key ? 600 : 500,
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px 18px",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="card border-0 mb-4" style={cardStyle}>
            <div className="card-body">

              <div className="row">

                <div className="col-md-6">
                  <h6 className="text-primary">Description</h6>
                  <p>{decision.description}</p>
                </div>

                <div className="col-md-3">
                  <h6 className="text-primary">Category</h6>
                  <p>{decision.category}</p>
                </div>

                <div className="col-md-3">
                  <h6 className="text-primary">Status</h6>
                  <p>{decision.status}</p>
                </div>

                <div className="col-md-3">
                  <h6 className="text-primary">Created By</h6>
                  <p>{decision.created_by}</p>
                </div>

                <div className="col-md-3">
                  <h6 className="text-primary">Created Date</h6>
                  <p>
                    {decision.created_at
                      ? new Date(decision.created_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

              </div>

              <hr />

              <div className="d-flex flex-wrap gap-2">

                <Link
                  to={`/decision/edit/${id}`}
                  className="btn btn-warning me-2"
                >
                  ✏️ Edit
                </Link>

                {user &&
                  ["Reviewer", "Manager", "Administrator"].includes(user.role) && (
                    <>
                      <button
                        className="btn btn-success me-2"
                        onClick={approveDecision}
                      >
                        ✅ Approve
                      </button>

                      <button
                        className="btn btn-secondary me-2"
                        onClick={rejectDecision}
                      >
                        ❌ Reject
                      </button>
                    </>
                )}

                <button
                  className="btn btn-danger"
                  onClick={deleteDecision}
                >
                  🗑 Delete
                </button>

              </div>

            </div>
          </div>
        )}

        {/* ALTERNATIVES TAB */}
        {activeTab === "alternatives" && (
          <div className="card border-0 mb-4" style={cardStyle}>
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Alternatives</h5>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddModal(true)}
                >
                  + Add Alternative
                </button>
              </div>

              {alternatives.length === 0 ? (
                <p className="text-muted text-center py-4">
                  No Alternatives Available
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">

                    <thead className="table-light">
                      <tr>
                        <th>Option</th>
                        <th>Pros</th>
                        <th>Cons</th>
                        <th>Estimated Cost</th>
                        <th>Feasibility</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>

                    <tbody>
                      {alternatives.map((alternative) => (
                        <tr key={alternative.id}>
                          <td className="fw-semibold">{alternative.option_name}</td>
                          <td>{alternative.pros}</td>
                          <td>{alternative.cons}</td>
                          <td>{alternative.estimated_cost}</td>
                          <td>{alternative.feasibility}</td>
                          <td>
                            <span
                              className={`badge ${
                                alternative.risk_level === "High"
                                  ? "bg-danger"
                                  : alternative.risk_level === "Medium"
                                  ? "bg-warning text-dark"
                                  : alternative.risk_level === "Low"
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >
                              {alternative.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              )}

            </div>
          </div>
        )}

        {/* DISCUSSION TAB */}
        {activeTab === "discussion" && (
          <div className="card border-0 mb-4" style={cardStyle}>
            <div className="card-body">

              <h5 className="fw-bold mb-4">Discussion</h5>

              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  marginBottom: "20px",
                }}
              >

                {comments.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    No Comments Available
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="d-flex align-items-start mb-3"
                    >

                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "#2563eb",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          flexShrink: 0,
                          marginRight: "12px",
                        }}
                      >
                        {(comment.created_by || "U").charAt(0).toUpperCase()}
                      </div>

                      <div
                        style={{
                          background: "#f1f5f9",
                          borderRadius: "14px",
                          padding: "10px 16px",
                          maxWidth: "80%",
                        }}
                      >
                        <div className="fw-semibold" style={{ fontSize: "14px" }}>
                          {comment.created_by || "User"}
                        </div>
                        <div style={{ fontSize: "14px" }}>
                          {comment.comment}
                        </div>
                        {comment.created_at && (
                          <div
                            className="text-muted mt-1"
                            style={{ fontSize: "11px" }}
                          >
                            {new Date(comment.created_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                )}

              </div>

              <form
                onSubmit={submitComment}
                className="d-flex gap-2 border-top pt-3"
              >
                <input
                  className="form-control"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sendingComment}
                >
                  {sendingComment ? "..." : "Send"}
                </button>
              </form>

            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <div className="card border-0 mb-4" style={cardStyle}>
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Documents</h5>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FaUpload className="me-2" />
                  Upload Document
                </button>
              </div>

              {documents.length === 0 ? (
                <p className="text-muted text-center py-4">
                  No Documents Uploaded
                </p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="d-flex align-items-center border rounded p-3 mb-2"
                  >
                    {getFileIcon(doc.file_name)}
                    <span className="fw-semibold">{doc.file_name}</span>
                  </div>
                ))
              )}

            </div>
          </div>
        )}

        {/* VERSION HISTORY TAB */}
        {activeTab === "history" && (
          <div className="card border-0 mb-4" style={cardStyle}>
            <div className="card-body">

              <h5 className="fw-bold mb-4">Version History</h5>

              {history.length === 0 ? (
                <p className="text-muted text-center py-4">
                  No History Available
                </p>
              ) : (
                <div style={{ position: "relative", paddingLeft: "30px" }}>

                  {/* Vertical connecting line */}
                  <div
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "6px",
                      bottom: "6px",
                      width: "2px",
                      background: "#e5e7eb",
                    }}
                  ></div>

                  {history.map((item, index) => {
                    const versionNumber = history.length - index;

                    return (
                      <div
                        key={item.id}
                        style={{ position: "relative", marginBottom: "28px" }}
                      >

                        {/* Numbered dot */}
                        <div
                          style={{
                            position: "absolute",
                            left: "-30px",
                            top: "2px",
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "#2563eb",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {versionNumber}
                        </div>

                        <div
                          className="p-3"
                          style={{
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                        >

                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h6 className="fw-bold mb-0">
                              Version {versionNumber}
                            </h6>

                            <span
                              className={`badge ${
                                item.status === "Approved"
                                  ? "bg-success"
                                  : item.status === "Rejected"
                                  ? "bg-danger"
                                  : item.status === "Pending"
                                  ? "bg-warning text-dark"
                                  : "bg-secondary"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <p className="mb-1 mt-2">
                            <strong>Title:</strong> {item.title}
                          </p>

                          <p className="mb-1">
                            <strong>Category:</strong> {item.category}
                          </p>

                          <p className="mb-1">
                            <strong>Description:</strong> {item.description}
                          </p>

                          <small className="text-muted">
                            Updated:{" "}
                            {new Date(item.updated_at).toLocaleString()}
                          </small>

                        </div>

                      </div>
                    );
                  })}

                </div>
              )}

            </div>
          </div>
        )}
        {/* AI REVIEW TAB */}
        {activeTab === "aireview" && (
          <div className="card border-0 mb-4" style={cardStyle}>
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h5 className="fw-bold mb-0">
                  <FaRobot className="me-2" />
                  AI Review Assistant
                </h5>

                {user &&
                  ["Reviewer", "Manager", "Administrator"].includes(user.role) && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={runAIReview}
                      disabled={aiLoading}
                    >
                      {aiLoading ? "Analyzing..." : "Run AI Review"}
                    </button>
                )}
              </div>

              <p className="text-muted small mb-4">
                AI-assisted completeness check. This does not approve or reject the decision —
                the reviewer makes the final judgment.
              </p>

              {aiReviews.length === 0 ? (
                <p className="text-muted text-center py-4">
                  No AI review has been run yet.
                </p>
              ) : (
                aiReviews.map((review) => {
                  const fields = [
                    { label: "Problem Statement", status: review.problem_status, note: review.problem_note },
                    { label: "Alternatives", status: review.alternatives_status, note: review.alternatives_note },
                    { label: "Cost Analysis", status: review.cost_status, note: review.cost_note },
                    { label: "Risk Mitigation", status: review.risk_status, note: review.risk_note },
                    { label: "Supporting Documents", status: review.documents_status, note: review.documents_note },
                  ];

                  return (
                    <div
                      key={review.id}
                      className="p-3 mb-3"
                      style={{
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                      }}
                    >

                      <div className="row">
                        {fields.map((f) => (
                          <div className="col-md-6 mb-3" key={f.label}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-semibold" style={{ fontSize: "14px" }}>
                                {f.label}
                              </span>
                              <span
                                className={`badge ${
                                  f.status === "complete"
                                    ? "bg-success"
                                    : f.status === "incomplete"
                                    ? "bg-warning text-dark"
                                    : "bg-danger"
                                }`}
                              >
                                {f.status}
                              </span>
                            </div>
                            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
                              {f.note}
                            </p>
                          </div>
                        ))}
                      </div>

                      <hr />

                      <p className="mb-1">
                        <strong>Summary:</strong> {review.overall_summary}
                      </p>

                      <small className="text-muted">
                        Reviewed: {new Date(review.created_at).toLocaleString()}
                      </small>

                    </div>
                  );
                })
              )}

            </div>
          </div>
        )}
        {/* ADD ALTERNATIVE MODAL */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1050,
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              style={{
                ...cardStyle,
                background: "#fff",
                width: "100%",
                maxWidth: "480px",
                padding: "24px",
                margin: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
            >

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Add Alternative</h5>
                <button
                  className="btn btn-sm"
                  onClick={() => setShowAddModal(false)}
                  style={{ border: "none", background: "transparent" }}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={submitAlternative}>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Option Name</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Cloud Migration"
                    value={optionName}
                    onChange={(e) => setOptionName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Pros</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Advantages of this option"
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Cons</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Drawbacks of this option"
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                  />
                </div>

                <div className="row g-3 mb-3">

                  <div className="col-6">
                    <label className="form-label fw-semibold">Estimated Cost</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 50000"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-semibold">Feasibility</label>
                    <input
                      className="form-control"
                      placeholder="e.g. High"
                      value={feasibility}
                      onChange={(e) => setFeasibility(e.target.value)}
                    />
                  </div>

                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Risk Level</label>
                  <select
                    className="form-select"
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                  >
                    <option value="">Select Risk Level</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Add Alternative"}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* UPLOAD DOCUMENT MODAL */}
        {showUploadModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1050,
            }}
            onClick={() => setShowUploadModal(false)}
          >
            <div
              style={{
                ...cardStyle,
                background: "#fff",
                width: "100%",
                maxWidth: "420px",
                padding: "24px",
                margin: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
            >

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Upload Document</h5>
                <button
                  className="btn btn-sm"
                  onClick={() => setShowUploadModal(false)}
                  style={{ border: "none", background: "transparent" }}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={uploadFile}>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Select File
                  </label>

                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

export default DecisionDetails;
