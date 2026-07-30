import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/DiscussionRepo.css";

function Discussion() {

    const navigate = useNavigate();

    const [discussions, setDiscussions] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDiscussions();
    }, []);

    const loadDiscussions = async () => {

        try {

            const response = await API.get("/discussions/");

            setDiscussions(response.data);

        } catch (error) {

            console.log(error);

            alert("Unable to load discussions.");

        } finally {

            setLoading(false);

        }

    };

    const deleteDiscussion = async (id) => {

        if (!window.confirm("Delete this discussion?")) return;

        try {

            await API.delete(`/discussions/${id}`);

            setDiscussions(
                discussions.filter((discussion) => discussion.id !== id)
            );

            alert("Discussion deleted successfully.");

        } catch (error) {

            console.log(error);

            alert("Unable to delete discussion.");

        }

    };

    return (

        <div className="discussion-container">

            <div className="discussion-header">

                <h1>Discussion Repository</h1>

                <button
                    className="dashboard-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>

            </div>

            {loading ? (

                <h3>Loading...</h3>

            ) : discussions.length === 0 ? (

                <h3>No Discussions Found</h3>

            ) : (

                <table className="discussion-table">

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Decision ID</th>
                            <th>Username</th>
                            <th>Comment</th>
                            <th>Created At</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {discussions.map((discussion) => (

                            <tr key={discussion.id}>

                                <td>{discussion.id}</td>

                                <td>{discussion.decision_id}</td>
                                
                                <td>{discussion.username}</td>

                                <td>{discussion.message}</td>

                                <td>
                                    {discussion.created_at
                                        ? new Date(
                                              discussion.created_at
                                          ).toLocaleString()
                                        : "N/A"}
                                </td>

                                <td>

                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            deleteDiscussion(discussion.id)
                                        }
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

export default Discussion;