import { useEffect, useState } from "react";

import EmployeeDashboard from "./EmployeeDashboard";
import ReviewerDashboard from "./ReviewerDashboard";
import ManagerDashboard from "./ManagerDashboard";
import AdminDashboard from "./AdminDashboard";

import dummyUser from "../../data/dummyUser";

function Dashboard() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        setUser(dummyUser);
        setLoading(false);

    }, []);

    if (loading) {

        return <h2>Loading...</h2>;

    }

    if (!user) {

        return <h2>No User Found</h2>;

    }

    switch (user.role) {

        case "Administrator":

            return (
                <AdminDashboard user={user} />
            );

        case "Manager":

            return (
                <ManagerDashboard user={user} />
            );

        case "Reviewer":

            return (
                <ReviewerDashboard user={user} />
            );

        case "Employee":

            return (
                <EmployeeDashboard user={user} />
            );

        default:

            return (
                <EmployeeDashboard user={user} />
            );

    }

}

export default Dashboard;