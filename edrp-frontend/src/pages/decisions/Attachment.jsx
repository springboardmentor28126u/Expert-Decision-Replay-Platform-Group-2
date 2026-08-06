import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import AttachmentTable from "../../components/decision/AttachmentTable";
import api from "../../services/api";

import "../../styles/attachment.css";

function Attachment() {

    const { id } = useParams();

    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fileInputRef = useRef(null);

    useEffect(() => {
        loadAttachments();
    }, [id]);

    const loadAttachments = async () => {

        try {

            const response = await api.get(
                `/decisions/${id}/attachments`
            );

            setAttachments(response.data);

        } catch (error) {

            console.error("Load Attachment Error:", error);

        } finally {

            setLoading(false);

        }

    };

    const handleUploadClick = () => {

        fileInputRef.current.click();

    };

    const handleFileUpload = async (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const formData = new FormData();

        formData.append("file", file);

        try {

            await api.post(
                `/decisions/${id}/attachments`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            alert("Attachment Uploaded Successfully");

            loadAttachments();

        } catch (error) {

            console.error(error);

            alert("Upload Failed");

        }

    };

    const filteredAttachments = attachments.filter((item) =>
        item.file_name
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    if (loading) {

        return (

            <DashboardLayout>

                <h2>Loading Attachments...</h2>

            </DashboardLayout>

        );

    }

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

                    <button
                        className="add-btn"
                        onClick={handleUploadClick}
                    >
                        + Upload Attachment
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                    />

                </div>

                <div className="search-bar">

                    <input
                        type="text"
                        placeholder="Search attachment..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <AttachmentTable
                    attachments={filteredAttachments}
                    onDeleted={loadAttachments}
                />

            </div>

        </DashboardLayout>

    );

}

export default Attachment;