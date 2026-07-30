import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/VersionHistory.css";

function VersionHistory() {

    const navigate = useNavigate();

    const [versions, setVersions] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVersions();
    }, []);

    const loadVersions = async () => {

        try {

            const response = await API.get("/versions/");

            setVersions(response.data);

        } catch (error) {

            console.log(error);

            alert("Unable to load version history.");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="version-container">

            <div className="version-header">

                <h1>Version History</h1>

                <button
                    className="dashboard-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>

            </div>

            {loading ? (

                <h3>Loading...</h3>

            ) : versions.length === 0 ? (

                <h3>No Version History Available</h3>

            ) : (

                <table className="version-table">

                    <thead>

                        <tr>

                            <th>Version ID</th>
                            <th>Decision</th>
                            <th>Status</th>
                            <th>Action</th>
                            <th>Updated By</th>
                            <th>Date</th>

                        </tr>

                    </thead>

                    <tbody>

    {versions.map((version) => (

        <tr key={version.id}>

            <td>{version.id}</td>

            <td>{version.decision}</td>

            <td>{version.status}</td>

            <td>{version.action}</td>

            <td>{version.updated_by}</td>

            <td>
                {new Date(version.updated_at).toLocaleString()}
            </td>

        </tr>

    ))}

</tbody>

                </table>

            )}

        </div>

    );

}

export default VersionHistory;