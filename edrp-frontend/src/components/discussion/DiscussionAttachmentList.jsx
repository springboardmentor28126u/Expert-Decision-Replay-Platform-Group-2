function DiscussionAttachmentList() {

    const attachments = [
        {
            id: 1,
            fileName: "Cloud_Migration_Report.pdf",
            uploadedBy: "Raj",
            uploadedDate: "15 Jul 2026"
        },
        {
            id: 2,
            fileName: "AWS_Cost_Analysis.xlsx",
            uploadedBy: "Anjali",
            uploadedDate: "16 Jul 2026"
        }
    ];

    return (

        <div>

            <div className="section-header">

                <h2>Attachments</h2>

                <button className="approve-btn">
                    + Upload Attachment
                </button>

            </div>

            <div className="profile-card">

                {

                    attachments.map((file) => (

                        <div
                            key={file.id}
                            className="discussion-item"
                        >

                            <h4>{file.fileName}</h4>

                            <p>
                                <strong>Uploaded By :</strong> {file.uploadedBy}
                            </p>

                            <small>{file.uploadedDate}</small>

                            <br /><br />

                            <button className="view-btn">
                                Download
                            </button>

                            <button
                                className="reject-btn"
                                style={{ marginLeft: "10px" }}
                            >
                                Delete
                            </button>

                            <hr />

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default DiscussionAttachmentList;