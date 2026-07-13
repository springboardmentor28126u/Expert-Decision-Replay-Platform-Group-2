import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";
import dummyUser from "../../data/dummyUser";

function DecisionList() {

    const user = dummyUser;

    const decisions = [

        {
            id: 1,
            title: "Cloud Migration",
            status: "Draft",
            owner: "Raj",
            category: "Technology"
        },

        {
            id: 2,
            title: "AI Chatbot",
            status: "In Review",
            owner: "Anjali",
            category: "AI"
        },

        {
            id: 3,
            title: "CRM Upgrade",
            status: "Finalized",
            owner: "Rahul",
            category: "Software"
        }

    ];

    const isAdmin = user.role === "Administrator";
    const isManager = user.role === "Manager";

    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">

                    <h1>
                        Decision Management
                    </h1>

                    {(isAdmin || isManager) && (

                        <Link
                            to="/decisions/create"
                            className="approve-btn"
                        >
                            Create Decision
                        </Link>

                    )}

                </div>

                <table className="decision-table">

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Owner</th>
                            <th>Category</th>
                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            decisions.map((decision) => (

                                <tr key={decision.id}>

                                    <td>{decision.id}</td>

                                    <td>{decision.title}</td>

                                    <td>{decision.status}</td>

                                    <td>{decision.owner}</td>

                                    <td>{decision.category}</td>

                                    <td>

                                        <Link
                                            to={`/decisions/${decision.id}`}
                                            className="approve-btn"
                                        >
                                            View
                                        </Link>

                                        {(isAdmin || isManager) && (

                                            <>

                                                <Link
                                                    to={`/decisions/edit/${decision.id}`}
                                                    className="approve-btn"
                                                >
                                                    Edit
                                                </Link>

                                                <button
                                                    className="reject-btn"
                                                >
                                                    Delete
                                                </button>

                                            </>

                                        )}

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

        </DashboardLayout>

    );

}

export default DecisionList;