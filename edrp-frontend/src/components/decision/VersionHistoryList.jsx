
import VersionHistoryTable from "./VersionHistoryTable";

function VersionHistoryList({ decisionId }) {

    const versions = [
        {
            id: 1,
            version: "v1.0",
            updatedBy: "Raj",
            updatedDate: "10 Jul 2026",
            summary: "Initial Decision Created",
            status: "Published"
        },
        {
            id: 2,
            version: "v1.1",
            updatedBy: "Anjali",
            updatedDate: "12 Jul 2026",
            summary: "Added Cloud Cost Analysis",
            status: "Draft"
        }
    ];


    return (
        <div>

            <VersionHistoryTable
                versions={versions}
            />

        </div>
    );
}

export default VersionHistoryList;