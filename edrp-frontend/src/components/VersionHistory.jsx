import "../styles/dashboard.css";

function VersionHistory({ decisionId }) {

    return (
        <div className="dashboard-section">

            <h2>Version History</h2>

            <ul>
                <li>Version 1 - Initial Decision Created</li>
                <li>Version 2 - Updated Description</li>
            </ul>

        </div>
    );
}

export default VersionHistory;