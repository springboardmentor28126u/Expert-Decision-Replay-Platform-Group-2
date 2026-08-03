import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Reports() {
  const [report, setReport] = useState({
    total_decisions: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    draft: 0,
    category_report: {},
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/reports/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReport(response.data);
    } catch (err) {
      console.log(err);
    }
  };

const downloadPDF = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await api.get("/reports/pdf", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));

    const link = document.createElement("a");
    link.href = url;
    link.download = "Decision_Report.pdf";

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.log(err);
    alert("Failed to download PDF");
  }
};

const downloadExcel = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await api.get("/reports/excel", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));

    const link = document.createElement("a");
    link.href = url;
    link.download = "Decision_Report.xlsx";

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.log(err);
    alert("Failed to download Excel");
  }
};

  return (
    <Layout>
      <div className="container mt-4">

        <h2 className="fw-bold mb-4">
          Reports Dashboard
        </h2>

        <div className="row">

          <div className="col-md-3 mb-3">
            <div className="card shadow border-0 bg-primary text-white">
              <div className="card-body text-center">
                <h5>Total Decisions</h5>
                <h2>{report.total_decisions}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow border-0 bg-success text-white">
              <div className="card-body text-center">
                <h5>Approved</h5>
                <h2>{report.approved}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow border-0 bg-warning">
              <div className="card-body text-center">
                <h5>Pending</h5>
                <h2>{report.pending}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow border-0 bg-danger text-white">
              <div className="card-body text-center">
                <h5>Rejected</h5>
                <h2>{report.rejected}</h2>
              </div>
            </div>
          </div>

        </div>

        <div className="card shadow mt-4">
          <div className="card-header">
            <h4>Category Report</h4>
          </div>

          <div className="card-body">

            <table className="table table-bordered">

              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Decisions</th>
                </tr>
              </thead>

              <tbody>

                {Object.entries(report.category_report).map(([category, count]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{count}</td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        </div>

        <div className="mt-4">

          <button
            className="btn btn-danger me-3"
            onClick={downloadPDF}
          >
            Download PDF Report
          </button>

          <button
            className="btn btn-success"
            onClick={downloadExcel}
          >
            Download Excel Report
          </button>

        </div>

      </div>
    </Layout>
  );
}

export default Reports;