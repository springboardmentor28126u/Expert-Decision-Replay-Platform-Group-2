import { useEffect, useState } from "react";

import EmployeeDashboard from "./EmployeeDashboard";
import ReviewerDashboard from "./ReviewerDashboard";
import ManagerDashboard from "./ManagerDashboard";
import AdminDashboard from "./AdminDashboard";

function Dashboard() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        // Temporary Dummy User
        // Backend ready hone ke baad API se replace karenge

        const dummyUser = {
            id: 1,
            name: "Raj Upadhyay",
            email: "raj@gmail.com",
            role: "Manager"
        };

        setUser(dummyUser);
        setLoading(false);

    }, []);

    if (loading) {
        return <h2>Loading...</h2>;
    }

    switch (user.role) {

        case "Administrator":
            return <AdminDashboard user={user} />;

        case "Manager":
            return <ManagerDashboard user={user} />;

        case "Reviewer":
            return <ReviewerDashboard user={user} />;

        default:
            return <EmployeeDashboard user={user} />;
    }

}

export default Dashboard;