import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

import "../../styles/discussion.css";


function CreateDiscussion(){


    const { decisionId } = useParams();

    const navigate = useNavigate();


    const [user,setUser] = useState(null);

    const [title,setTitle] = useState("");

    const [loading,setLoading] = useState(true);



    useEffect(()=>{

        loadUser();

    },[]);



    const loadUser = async()=>{

        try{

            const response = await api.get("/users/me");

            setUser(response.data);

        }
        catch(error){

            console.log(error);

        }
        finally{

            setLoading(false);

        }

    };



    const handleSubmit = async(e)=>{


        e.preventDefault();


        try{


            await api.post(

                `/decisions/${decisionId}/discussion`,

                {
                    title:title
                }

            );


            alert("Discussion created successfully");


            navigate(
                `/decisions/${decisionId}/discussion`
            );


        }
        catch(error){

            console.log(error);

            alert("Failed to create discussion");

        }


    };



    if(loading){

        return <h2>Loading...</h2>;

    }



    return(


        <DashboardLayout user={user}>


            <div className="discussion-page">


                <div className="discussion-header">

                    <h1>Create Discussion</h1>

                </div>



                <div className="profile-card">


                    <form onSubmit={handleSubmit}>


                        <label>
                            Discussion Title
                        </label>


                        <input

                            type="text"

                            value={title}

                            onChange={(e)=>
                                setTitle(e.target.value)
                            }

                            placeholder="Enter discussion title"

                            required

                        />


                        <br/><br/>


                        <button
                            className="approve-btn"
                            type="submit"
                        >

                            Create Discussion

                        </button>


                    </form>


                </div>


            </div>


        </DashboardLayout>


    );


}


export default CreateDiscussion;