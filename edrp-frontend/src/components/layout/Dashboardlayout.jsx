import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import dummyUser from "../../data/dummyUser";

function DashboardLayout({ user = dummyUser, children }) {
    console.log("Current User:", user);
    console.log("Role:", user.role);
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