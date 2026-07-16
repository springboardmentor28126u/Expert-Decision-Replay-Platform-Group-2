import { Link } from "react-router-dom";

function DiscussionTable({ discussions }) {

    return (

        <div className="table-container">

            <table className="discussion-table">

                <thead>

                    <tr>
                        <th>ID</th>
                        <th>Discussion Title</th>
                        <th>Created By</th>
                        <th>Created Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>

                </thead>

                <tbody>

                    {discussions.length > 0 ? (

                        discussions.map((discussion) => (

                            <tr key={discussion.id}>

                                <td>{discussion.id}</td>

                                <td>
                                    <strong>{discussion.title}</strong>
                                </td>

                                <td>{discussion.createdBy}</td>

                                <td>{discussion.createdDate}</td>

                                <td>
                                    <span
                                        className={`status ${discussion.status.toLowerCase()}`}
                                    >
                                        {discussion.status}
                                    </span>
                                </td>

                                <td>

                                    <Link
                                        to={`/discussions/${discussion.id}`}
                                        className="view-btn"
                                    >
                                        View
                                    </Link>

                                </td>

                            </tr>

                        ))

                    ) : (

                        <tr>

                            <td
                                colSpan="6"
                                className="no-data"
                            >
                                No Discussions Found
                            </td>

                        </tr>

                    )}

                </tbody>

            </table>

        </div>

    );

}

export default DiscussionTable;