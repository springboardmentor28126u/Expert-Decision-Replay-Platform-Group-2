import "../../styles/dashboard.css";


function Teams() {


    const teams = [

        {
            id: 1,
            name: "Frontend Team",
            manager: "Raj Upadhyay"
        },

        {
            id: 2,
            name: "Backend Team",
            manager: "Rahul"
        },

        {
            id: 3,
            name: "QA Team",
            manager: "Anjali"
        }

    ];



    return (

        <div className="dashboard-page">


            <div className="page-header">


                <h1>
                    Team Management
                </h1>


                <p>
                    Create and manage organization teams
                </p>


            </div>





            <div className="dashboard-section">


                <div className="section-header">


                    <h2>
                        All Teams
                    </h2>



                    <button className="approve-btn">
                        Create Team
                    </button>


                </div>





                <table className="decision-table">


                    <thead>


                        <tr>

                            <th>
                                Team Name
                            </th>


                            <th>
                                Manager
                            </th>


                            <th>
                                Action
                            </th>


                        </tr>


                    </thead>





                    <tbody>


                        {

                            teams.map((team)=>(

                                <tr key={team.id}>


                                    <td>
                                        {team.name}
                                    </td>


                                    <td>
                                        {team.manager}
                                    </td>


                                    <td>


                                        <button className="view-btn">
                                            Assign User
                                        </button>


                                    </td>


                                </tr>

                            ))

                        }


                    </tbody>


                </table>



            </div>


        </div>

    );

}


export default Teams;