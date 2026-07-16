import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import KnowledgeTable from "../../components/decision/KnowledgeTable";
import "../../styles/knowledge.css";

function Knowledge() {

    const [search, setSearch] = useState("");

    const knowledge = [
        {
            id: 1,
            title: "Cloud Migration Report",
            category: "Report",
            uploadedBy: "Raj",
            uploadDate: "15 Jul 2026",
            status: "Approved"
        },
        {
            id: 2,
            title: "AWS Cost Analysis",
            category: "Research",
            uploadedBy: "Anjali",
            uploadDate: "14 Jul 2026",
            status: "Pending"
        },
        {
            id: 3,
            title: "Security Checklist",
            category: "Document",
            uploadedBy: "Admin",
            uploadDate: "13 Jul 2026",
            status: "Approved"
        }
    ];

    const filteredKnowledge = knowledge.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <DashboardLayout>

            <div className="knowledge-page">

                <div className="knowledge-header">

                    <div>

                        <h2>Knowledge Repository</h2>

                        <p>
                            Manage documents and references related to this decision.
                        </p>

                    </div>

                    <button className="upload-btn">
                        + Upload Knowledge
                    </button>

                </div>

                <div className="knowledge-search">

                    <input
                        type="text"
                        placeholder="Search knowledge..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                </div>

                <KnowledgeTable knowledge={filteredKnowledge} />

            </div>

        </DashboardLayout>

    );

}

export default Knowledge;