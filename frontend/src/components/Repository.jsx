import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Repository.css";

function Repository() {

    const navigate = useNavigate();

    const [files, setFiles] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {

        try {

            const response = await API.get("/files/all");

            setFiles(response.data);

        } catch (error) {

            console.log(error);

            alert("Unable to load repository.");

        } finally {

            setLoading(false);

        }

    };

    const deleteFile = async (id) => {

    const confirmDelete = window.confirm(
        "Are you sure you want to delete this file?"
    );

    if (!confirmDelete) return;

    try {

        await API.delete(`/files/${id}`);

        setFiles(files.filter(file => file.id !== id));

        alert("File deleted successfully.");

    } catch (error) {

        console.log(error);

        alert("Unable to delete file.");

    }

};

    return (

        <div className="repository-container">

            <div className="repository-header">

                <h1>Document Repository</h1>

                <button
                    className="dashboard-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>

            </div>

            {loading ? (

                <h3>Loading...</h3>

            ) : files.length === 0 ? (

                <h3>No Files Uploaded</h3>

            ) : (

                <table className="repository-table">

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>File Name</th>
                            <th>Decision ID</th>
                            <th>Uploaded Date</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {files.map((file) => (

                            <tr key={file.id}>

                                <td>{file.id}</td>

                                <td>{file.filename}</td>

                                <td>{file.decision_id}</td>

                                <td>
    {file.uploaded_at
        ? new Date(file.uploaded_at).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "N/A"}
</td><td>
                      <button
    className="delete-btn"
    onClick={() => deleteFile(file.id)}
>
    Delete
</button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            )}

        </div>

    );

}

export default Repository;