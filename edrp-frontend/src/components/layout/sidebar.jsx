import { Link } from "react-router-dom";

import "../../styles/sidebar.css";
function Sidebar({ role }) {


    return (

        <aside className="sidebar" >


            <div className="sidebar-logo">

                <h2>
                    EDRP
                </h2>

                <p>
                    Decision Platform
                </p>

            </div>



            <nav>

                <ul>


                    <li>
                        <Link to="/dashboard">
                            Dashboard
                        </Link>
                    </li>



                    <li>
                        <Link to="/decisions">
                            Decision Management
                        </Link>
                    </li>



                    <li>
                        <Link to="/discussions">
                            Discussions
                        </Link>
                    </li>



                    <li>
                        <Link to="/reports">
                            Reports
                        </Link>
                    </li>



                    {
                    (role === "Manager" || role === "Administrator") &&

                    <li>
                        <Link to="/approvals">
                            Approvals
                        </Link>
                    </li>
                    }



                    {
                    role === "Administrator" &&

                    <>

                    <li>
                        <Link to="/users">
                            Users
                        </Link>
                    </li>


                    <li>
                        <Link to="/teams">
                            Teams
                        </Link>
                    </li>


                    <li>
                        <Link to="/audit">
                            Audit Logs
                        </Link>
                    </li>


                    <li>
                        <Link to="/settings">
                            Settings
                        </Link>
                    </li>

                    </>
                    }


                </ul>

            </nav>


        </aside>

    );

}


export default Sidebar;