import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";

import api from "../../services/api";


function ManagerDashboard() {

    const [user, setUser] = useState(null);

    const [teams, setTeams] = useState([]);

    const [decisions, setDecisions] = useState([]);

    const [loading, setLoading] = useState(true);



    useEffect(() => {

        loadData();

    }, []);



    const loadData = async () => {

        try {

            const userRes = await api.get("/users/me");

            const teamRes = await api.get("/teams");

            const decisionRes = await api.get("/decisions");


            setUser(userRes.data);

            setTeams(teamRes.data);

            setDecisions(decisionRes.data);


        }
        catch(error) {

            console.log("Dashboard Error:", error);

        }
        finally {

            setLoading(false);

        }

    };



    if(loading) {

        return (

            <h2>
                Loading Manager Dashboard...
            </h2>

        );

    }



    return (

        <DashboardLayout user={user || {name:"Manager"}}>


            <div className="dashboard-page">



                <div className="page-header">


                    <h1>
                        Manager Dashboard
                    </h1>


                    <p>
                        Welcome back, {user?.name || "Manager"}
                    </p>


                </div>





                {/* Statistics */}

                <div className="stats-grid">



                    <div className="stat-card">


                        <h3>
                            Total Decisions
                        </h3>


                        <h2>
                            {decisions.length}
                        </h2>


                    </div>




                    <div className="stat-card">


                        <h3>
                            Total Teams
                        </h3>


                        <h2>
                            {teams.length}
                        </h2>


                    </div>



                </div>






                {/* Teams Section */}


                <div className="dashboard-section">


                    <h2>
                        Teams
                    </h2>




                    <table className="decision-table">


                        <thead>

                            <tr>


                                <th>
                                    Team ID
                                </th>


                                <th>
                                    Team Name
                                </th>


                                <th>
                                    Manager ID
                                </th>


                            </tr>


                        </thead>



                        <tbody>


                        {

                            teams.length > 0 ?

                            teams.map((team)=>(


                                <tr key={team.id}>


                                    <td>
                                        {team.id}
                                    </td>


                                    <td>
                                        {team.name}
                                    </td>


                                    <td>
                                        {team.manager_id || "-"}
                                    </td>


                                </tr>


                            ))

                            :

                            (

                                <tr>

                                    <td colSpan="3">
                                        No Teams Found
                                    </td>

                                </tr>

                            )

                        }


                        </tbody>


                    </table>



                </div>









                {/* Decision Section */}


                <div className="dashboard-section">


                    <h2>
                        Decision Management
                    </h2>





                    <table className="decision-table">



                        <thead>


                            <tr>


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


                            decisions.length > 0 ?


                            decisions.map((decision)=>(


                                <tr key={decision.id}>


                                    <td>
                                        {decision.title}
                                    </td>


                                    <td>
                                        {decision.status}
                                    </td>


                                </tr>


                            ))


                            :


                            (

                                <tr>

                                    <td colSpan="2">
                                        No Decisions Found
                                    </td>


                                </tr>

                            )


                        }


                        </tbody>



                    </table>



                </div>





            </div>


        </DashboardLayout>

    );

}


export default ManagerDashboard;