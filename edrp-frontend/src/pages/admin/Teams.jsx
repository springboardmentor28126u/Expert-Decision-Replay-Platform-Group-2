import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/dashboard.css";

import DashboardLayout from "../../components/layout/DashboardLayout";


function Teams({ user }) {


    const isAdmin = user?.role === "Administrator";


    const [teams, setTeams] = useState([]);

    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);


    const [formData, setFormData] = useState({

        name: "",
        manager_id: ""

    });



    useEffect(() => {

        loadTeams();

    }, []);



    const loadTeams = async () => {


        try {


            const response = await api.get("/teams");


            setTeams(response.data);


        }
        catch(error){


            console.error("Team Error:", error);


            alert(
                error.response?.data?.detail ||
                "Unable to load teams"
            );


        }
        finally{


            setLoading(false);


        }


    };





    const handleChange = (e)=>{


        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });


    };







    const createTeam = async(e)=>{


        e.preventDefault();



        try{


            await api.post("/teams",{


                name: formData.name,


                manager_id:
                    formData.manager_id === ""
                    ?
                    null
                    :
                    Number(formData.manager_id)


            });



            alert("Team Created Successfully");



            setFormData({

                name:"",
                manager_id:""

            });



            setShowForm(false);



            loadTeams();



        }
        catch(error){



            console.error(error);



            alert(

                error.response?.data?.detail ||
                "Unable to create team"

            );


        }


    };






    if(loading){


        return <h2>Loading Teams...</h2>;


    }





    return(


        <DashboardLayout user={user}>


            <div className="dashboard-page">



                <div className="page-header">


                    <h1>
                        Team Management
                    </h1>


                    <p>
                        View and manage organization teams
                    </p>


                </div>





                <div className="dashboard-section">



                    <div className="section-header">



                        <h2>
                            All Teams
                        </h2>




                        {
                            isAdmin && (

                                <button

                                    className="approve-btn"

                                    onClick={()=>setShowForm(!showForm)}

                                >

                                    {
                                        showForm
                                        ?
                                        "Cancel"
                                        :
                                        "Create Team"
                                    }


                                </button>

                            )
                        }



                    </div>







                    {
                        isAdmin && showForm && (


                            <form

                                onSubmit={createTeam}

                                style={{
                                    marginBottom:"20px"
                                }}

                            >



                                <input

                                    type="text"

                                    name="name"

                                    placeholder="Team Name"

                                    value={formData.name}

                                    onChange={handleChange}

                                    required

                                />





                                <input

                                    type="number"

                                    name="manager_id"

                                    placeholder="Manager ID (Optional)"

                                    value={formData.manager_id}

                                    onChange={handleChange}

                                />






                                <button

                                    className="approve-btn"

                                    type="submit"

                                >

                                    Save Team

                                </button>




                            </form>


                        )
                    }







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

                                        {
                                            team.manager_id
                                            ?
                                            team.manager_id
                                            :
                                            "-"
                                        }

                                    </td>



                                </tr>


                            ))


                            :


                            <tr>


                                <td colSpan="3">

                                    No Teams Found

                                </td>


                            </tr>


                        }



                        </tbody>




                    </table>





                </div>




            </div>



        </DashboardLayout>


    );


}


export default Teams;