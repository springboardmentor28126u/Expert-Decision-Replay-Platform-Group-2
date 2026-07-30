import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Reports.css";

function Reports() {

    const navigate = useNavigate();

    const [report, setReport] = useState(null);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {

        try {

            const response = await API.get("/dashboard/reports");

            setReport(response.data);

        } catch (error) {

            console.log(error);

            alert("Unable to load reports.");

        }

    };

    if (!report) return <h2>Loading...</h2>;

    return (

        <div className="report-container">

            <div className="report-card">

                <h1>REPORTS</h1>

                <hr/>

                <div className="summary">

                    <div>
                        <p>Total Decisions</p>
                        <h2>{report.total}</h2>
                    </div>

                    <div>
                        <p>Approved Decisions</p>
                        <h2>{report.approved}</h2>
                    </div>

                    <div>
                        <p>Pending Decisions</p>
                        <h2>{report.pending}</h2>
                    </div>

                    <div>
                        <p>Rejected Decisions</p>
                        <h2>{report.rejected}</h2>
                    </div>

                </div>

                <hr/>

                <div className="summary">

                    <div>
                        <p>Total Alternatives</p>
                        <h2>{report.alternatives}</h2>
                    </div>

                    <div>
                        <p>Uploaded Documents</p>
                        <h2>{report.files}</h2>
                    </div>

                    <div>
                        <p>Total Discussions</p>
                        <h2>{report.discussions}</h2>
                    </div>

                    <div>
                        <p>Version Records</p>
                        <h2>{report.versions}</h2>
                    </div>

                </div>

                <hr/>

                <h2>Recent Activity</h2>

                <table>

                    <thead>

                        <tr>

                            <th>Decision</th>

                            <th>Status</th>

                            <th>Updated By</th>

                            <th>Date</th>

                        </tr>

                    </thead>

                    <tbody>

                        {report.recent.map((item) => (

                            <tr key={item.id}>

                                <td>{item.title}</td>

                                <td>{item.status}</td>

                                <td>{item.created_by}</td>

                                <td>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

                <button
                    onClick={() => navigate("/dashboard")}
                >
                    ← Back to Dashboard
                </button>

            </div>

        </div>

    );

}

export default Reports;