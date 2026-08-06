import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import api from "../../services/api";

function DashboardLayout({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        console.log("Loading User...");
        try {

            const response = await api.get("/users/me");
            setUser(response.data);

        } catch (error) {

            console.error(error);

            localStorage.removeItem("access_token");
            navigate("/login");

        } finally {

            setLoading(false);

        }
    };

    if (loading) {
        return <h2>Loading...</h2>;
    }
    console.log("DashboardLayout Loading:", loading);
    console.log("DashboardLayout User:", user);
    return (

        <div className="layout">

            <Sidebar role={user.role} />

            <div className="main-content">

                <Navbar user={user} />

                <main className="page-content">

                    {children}

                </main>

            </div>

        </div>

    );

}

export default DashboardLayout;