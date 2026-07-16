import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AttachmentTable from "../../components/decision/AttachmentTable";
import "../../styles/attachment.css";

function Attachment() {

    const [search, setSearch] = useState("");

    const attachments = [
        {
            id: 1,
            fileName: "Cloud_Migration_Report.pdf",
            fileType: "PDF",
            uploadedBy: "Raj",
            uploadDate: "15 Jul 2026"
        },
        {
            id: 2,
            fileName: "AWS_Cost_Analysis.xlsx",
            fileType: "Excel",
            uploadedBy: "Anjali",
            uploadDate: "14 Jul 2026"
        },
        {
            id: 3,
            fileName: "Architecture_Diagram.png",
            fileType: "Image",
            uploadedBy: "Admin",
            uploadDate: "13 Jul 2026"
        }
    ];

    const filteredAttachments = attachments.filter((item) =>
        item.fileName.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <DashboardLayout>

            <div className="attachment-page">

                <div className="page-header">

                    <div>

                        <h2>Attachments</h2>

                        <p>
                            View and manage all decision attachments.
                        </p>

                    </div>

                    <button className="add-btn">
                        + Upload Attachment
                    </button>

                </div>

                <div className="search-bar">

                    <input
                        type="text"
                        placeholder="Search attachment..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                </div>

                <AttachmentTable attachments={filteredAttachments} />

            </div>

        </DashboardLayout>

    );

}

export default Attachment;