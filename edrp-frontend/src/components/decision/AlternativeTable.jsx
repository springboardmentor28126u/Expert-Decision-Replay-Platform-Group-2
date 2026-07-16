import { Link } from "react-router-dom";

function AlternativeTable({ alternatives }) {

    const handleDelete = (id) => {

        if (window.confirm("Are you sure you want to delete this alternative?")) {

            // Backend API
            // DELETE /alternatives/{id}

            console.log("Delete Alternative:", id);
        }
    };

    return (

        <div className="table-container">

            <table className="alternative-table">

                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Alternative</th>
                        <th>Description</th>
                        <th>Pros</th>
                        <th>Cons</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>

                    {alternatives.length > 0 ? (

                        alternatives.map((item) => (

                            <tr key={item.id}>

                                <td>{item.id}</td>

                                <td>
                                    <strong>{item.name}</strong>
                                </td>

                                <td>{item.description}</td>

                                <td>{item.pros}</td>

                                <td>{item.cons}</td>

                                <td>
                                    <span className="score">
                                        {item.score}/10
                                    </span>
                                </td>

                                <td>

                                    <span
                                        className={`status ${item.status.toLowerCase()}`}
                                    >
                                        {item.status}
                                    </span>

                                </td>

                                <td>

                                    <Link
                                        to={`/alternatives/${item.id}`}
                                        className="view-btn"
                                    >
                                        View
                                    </Link>

                                    <Link
                                        to={`/alternatives/edit/${item.id}`}
                                        className="edit-btn"
                                    >
                                        Edit
                                    </Link>

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
                                colSpan="8"
                                className="no-data"
                            >
                                No Alternatives Found
                            </td>

                        </tr>

                    )}

                </tbody>

            </table>

        </div>

    );

}

export default AlternativeTable;