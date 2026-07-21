import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import VersionHistoryTable from "../../components/decision/VersionHistoryTable";
import "../../styles/versionHistory.css";

function VersionHistory() {

    const [search, setSearch] = useState("");

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
        },
        {
            id: 3,
            version: "v2.0",
            updatedBy: "Admin",
            updatedDate: "15 Jul 2026",
            summary: "Final Approval Completed",
            status: "Published"
        }
    ];


    const filteredVersions = versions.filter(item =>
        item.version.toLowerCase().includes(search.toLowerCase())
    );


    return (

        <DashboardLayout>

            <div className="history-page">

                <div className="history-header">

                    <div>

                        <h2>Version History</h2>

                        <p>
                            Track all updates made to this decision.
                        </p>

                    </div>

                </div>


                <div className="history-search">

                    <input
                        type="text"
                        placeholder="Search Version..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                </div>


                <VersionHistoryTable
                    versions={filteredVersions}
                />


            </div>

        </DashboardLayout>

    );

}

export default VersionHistory;