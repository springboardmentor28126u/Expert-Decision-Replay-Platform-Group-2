import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";


function EmployeeDashboard({ user }) {


    const statistics = [

        {
            title: "Account Status",
            value: "Active"
        },

        {
            title: "Role",
            value: user.role
        },

        {
            title: "Team",
            value: user.team_id ? "Assigned" : "Not Assigned"
        },

        {
            title: "Profile",
            value: "Completed"
        }

    ];



    return (

        <DashboardLayout user={user}>


            <div className="dashboard-page">


                <div className="page-header">


                    <h1>
                        Employee Dashboard
                    </h1>


                    <p>
                        Welcome back, {user.name}
                    </p>


                </div>





                {/* Statistics */}

                <div className="stats-grid">


                    {
                        statistics.map((item,index)=>(

                            <div
                                className="stat-card"
                                key={index}
                            >

                                <h3>
                                    {item.title}
                                </h3>


                                <h2>
                                    {item.value}
                                </h2>


                            </div>

                        ))
                    }


                </div>







                {/* My Profile */}


                <div className="dashboard-section">


                    <h2>
                        My Profile
                    </h2>



                    <div className="profile-card">


                        <p>
                            <strong>Name:</strong> {user.name}
                        </p>


                        <p>
                            <strong>Email:</strong> {user.email}
                        </p>


                        <p>
                            <strong>Role:</strong> {user.role}
                        </p>



                    </div>


                </div>








                {/* My Team */}


                <div className="dashboard-section">


                    <h2>
                        My Team
                    </h2>



                    <div className="team-card">


                        <p>
                            Team Information
                        </p>


                        {

                        user.team_id ?

                        <p>
                            Assigned Team ID : {user.team_id}
                        </p>

                        :

                        <p>
                            No Team Assigned
                        </p>

                        }


                    </div>


                </div>








                {/* Quick Actions */}


                <div className="dashboard-section">


                    <h2>
                        Quick Actions
                    </h2>



                    <div className="approval-list">



                        <div className="approval-card">


                            <h3>
                                View Profile
                            </h3>


                            <p>
                                Check your account details.
                            </p>


                            <button className="approve-btn">
                                View
                            </button>


                        </div>





                        <div className="approval-card">


                            <h3>
                                View Team
                            </h3>


                            <p>
                                Check your assigned team.
                            </p>


                            <button className="approve-btn">
                                View
                            </button>


                        </div>



                    </div>



                </div>




            </div>


        </DashboardLayout>

    );


}


export default EmployeeDashboard;