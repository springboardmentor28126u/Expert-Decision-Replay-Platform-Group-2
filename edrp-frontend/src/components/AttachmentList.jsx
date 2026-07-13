import "../styles/dashboard.css";

function AttachmentList({ decisionId }) {

    return (
        <div className="dashboard-section">

            <h2>Attachments</h2>

            <ul>
                <li>Requirement.pdf</li>
                <li>Architecture.png</li>
            </ul>

        </div>
    );
}

export default AttachmentList;