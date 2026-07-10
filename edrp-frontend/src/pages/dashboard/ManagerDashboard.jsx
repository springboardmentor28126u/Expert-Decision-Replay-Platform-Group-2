import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";


function ManagerDashboard({ user }) {


    const statistics = [

        {
            title: "Team Decisions",
            value: 45
        },

        {
            title: "Pending Approvals",
            value: 10
        },

        {
            title: "Approved Decisions",
            value: 32
        },

        {
            title: "Team Members",
            value: 18
        }

    ];



    return (

        <DashboardLayout user={user}>


            <div className="dashboard-page">


                <div className="page-header">

                    <h1>
                        Manager Dashboard
                    </h1>


                    <p>
                        Welcome back, {user.name}
                    </p>

                </div>



                {/* Statistics Cards */}

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




                {/* Team Decisions */}


                <div className="dashboard-section">


                    <h2>
                        Team Decisions
                    </h2>



                    <table className="decision-table">


                        <thead>

                            <tr>

                                <th>
                                    Decision
                                </th>

                                <th>
                                    Owner
                                </th>

                                <th>
                                    Status
                                </th>


                            </tr>

                        </thead>



                        <tbody>


                            <tr>

                                <td>
                                    Cloud Migration
                                </td>

                                <td>
                                    Raj
                                </td>

                                <td>
                                    Approved
                                </td>

                            </tr>



                            <tr>

                                <td>
                                    Security Upgrade
                                </td>

                                <td>
                                    Anjali
                                </td>

                                <td>
                                    Under Review
                                </td>

                            </tr>


                        </tbody>


                    </table>


                </div>





                {/* Pending Approvals */}


                <div className="dashboard-section">


                    <h2>
                        Pending Approvals
                    </h2>



                    <div className="approval-list">


                        <div className="approval-card">

                            <h3>
                                New Hiring Process
                            </h3>

                            <p>
                                Submitted by Rahul
                            </p>


                            <button className="approve-btn">
                                Approve
                            </button>


                            <button className="reject-btn">
                                Reject
                            </button>


                        </div>



                        <div className="approval-card">

                            <h3>
                                Budget Planning
                            </h3>

                            <p>
                                Submitted by Anjali
                            </p>


                            <button className="approve-btn">
                                Approve
                            </button>


                            <button className="reject-btn">
                                Reject
                            </button>


                        </div>



                    </div>


                </div>



            </div>


        </DashboardLayout>

    );

}


export default ManagerDashboard;