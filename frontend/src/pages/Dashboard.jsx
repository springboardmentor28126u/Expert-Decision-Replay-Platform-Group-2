import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/decisions/stats/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(response.data);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout>
      <h2 className="fw-bold mb-4">
        Dashboard
      </h2>

      <div className="row">

        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card border-0 shadow-lg bg-primary text-white">
            <div className="card-body text-center">
              <FaClipboardList size={35} />
              <h5 className="mt-3">Total Decisions</h5>
              <h1>{stats.total}</h1>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card border-0 shadow-lg bg-success text-white">
            <div className="card-body text-center">
              <FaCheckCircle size={35} />
              <h5 className="mt-3">Approved</h5>
              <h1>{stats.approved}</h1>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card border-0 shadow-lg bg-warning text-dark">
            <div className="card-body text-center">
              <FaClock size={35} />
              <h5 className="mt-3">Pending</h5>
              <h1>{stats.pending}</h1>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card border-0 shadow-lg bg-danger text-white">
            <div className="card-body text-center">
              <FaTimesCircle size={35} />
              <h5 className="mt-3">Rejected</h5>
              <h1>{stats.rejected}</h1>
            </div>
          </div>
        </div>

      </div>

      <div className="card shadow-lg border-0 mt-4">
        <div className="card-body">

          <h4 className="fw-bold mb-3">
            Recent Activities
          </h4>

          <div className="list-group">

            <div className="list-group-item">
              ✅ Decision Created Successfully
            </div>

            <div className="list-group-item">
              📄 Document Uploaded
            </div>

            <div className="list-group-item">
              💬 Comment Added
            </div>

            <div className="list-group-item">
              ⚖ Alternative Added
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;