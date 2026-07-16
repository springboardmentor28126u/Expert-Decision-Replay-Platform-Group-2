function AttachmentTable({ attachments }) {

    const handleDownload = (id) => {

        // Backend API
        // GET /attachments/{id}

        console.log("Download Attachment:", id);

    };

    const handleDelete = (id) => {

        if (window.confirm("Are you sure you want to delete this attachment?")) {

            // Backend API
            // DELETE /attachments/{id}

            console.log("Delete Attachment:", id);

        }

    };

    return (

        <div className="table-container">

            <table className="attachment-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>File Name</th>
                        <th>File Type</th>
                        <th>Uploaded By</th>
                        <th>Upload Date</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        attachments.length > 0 ? (

                            attachments.map((item) => (

                                <tr key={item.id}>

                                    <td>{item.id}</td>

                                    <td>

                                        <strong>
                                            {item.fileName}
                                        </strong>

                                    </td>

                                    <td>{item.fileType}</td>

                                    <td>{item.uploadedBy}</td>

                                    <td>{item.uploadDate}</td>

                                    <td>

                                        <button
                                            className="view-btn"
                                            onClick={() => handleDownload(item.id)}
                                        >
                                            Download
                                        </button>

                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="no-data"
                                >
                                    No Attachments Found
                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default AttachmentTable;