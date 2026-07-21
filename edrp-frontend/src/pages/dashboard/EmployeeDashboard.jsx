import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";

import api from "../../services/api";


function EmployeeDashboard() {


    const [user, setUser] = useState(null);

    const [decisions, setDecisions] = useState([]);

    const [loading, setLoading] = useState(true);



    useEffect(() => {

        fetchUser();

        fetchMyDecisions();

    }, []);





    // Get Logged In User

    const fetchUser = async () => {

        try {

            const response = await api.get(
                "/users/me"
            );


            setUser(response.data);


        } catch(error) {

            console.log(
                "User Fetch Error:",
                error
            );

        }

    };





    // Get Employee Decisions

    const fetchMyDecisions = async () => {

        try {


            const response = await api.get(
                "/decisions/my"
            );


            setDecisions(response.data);


        }
        catch(error){


            console.log(
                "Decision Fetch Error:",
                error
            );


        }
        finally{

            setLoading(false);

        }

    };





    if(loading){

        return (
            <h2>
                Loading...
            </h2>
        );

    }





    if(!user){

        return (
            <h2>
                User Not Found
            </h2>
        );

    }





    const statistics = [


        {
            title:"Account Status",
            value:"Active"
        },


        {
            title:"Role",
            value:user.role
        },


        {
            title:"Team",
            value:user.team_id
            ?
            "Assigned"
            :
            "Not Assigned"
        },


        {
            title:"My Decisions",
            value:decisions.length
        }


    ];






    return (


        <DashboardLayout user={user}>


            <div className="dashboard-page">





                {/* Header */}

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









                {/* Profile Section */}


                <div className="dashboard-section">


                    <h2>
                        My Profile
                    </h2>



                    <div className="profile-card">


                        <p>
                            <strong>
                                Name:
                            </strong>

                            {" "}

                            {user.name}

                        </p>



                        <p>

                            <strong>
                                Email:
                            </strong>

                            {" "}

                            {user.email}

                        </p>




                        <p>

                            <strong>
                                Role:
                            </strong>

                            {" "}

                            {user.role}

                        </p>




                        <p>

                            <strong>
                                Team ID:
                            </strong>

                            {" "}

                            {
                                user.team_id
                                ?
                                user.team_id
                                :
                                "Not Assigned"
                            }

                        </p>



                    </div>



                </div>









                {/* Decisions Section */}


                <div className="dashboard-section">


                    <h2>
                        My Decisions
                    </h2>




                    <table className="decision-table">


                        <thead>

                            <tr>

                                <th>
                                    ID
                                </th>


                                <th>
                                    Title
                                </th>


                                <th>
                                    Status
                                </th>


                            </tr>


                        </thead>





                        <tbody>



                        {

                            decisions.length > 0

                            ?

                            decisions.map((item)=>(


                                <tr key={item.id}>


                                    <td>
                                        {item.id}
                                    </td>


                                    <td>
                                        {item.title}
                                    </td>


                                    <td>
                                        {item.status}
                                    </td>


                                </tr>


                            ))


                            :


                            <tr>


                                <td colSpan="3">

                                    No Decisions Found

                                </td>


                            </tr>


                        }



                        </tbody>



                    </table>



                </div>









                {/* Quick Actions */}


                <div className="dashboard-section">


                    <h2>
                        Quick Actions
                    </h2>



                    <div className="approval-list">



                        <div className="approval-card">


                            <h3>
                                Create Decision
                            </h3>


                            <p>
                                Create a new organizational decision.
                            </p>


                            <button className="approve-btn">

                                Create

                            </button>



                        </div>






                        <div className="approval-card">


                            <h3>
                                View Decisions
                            </h3>


                            <p>
                                Check your previous decisions.
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