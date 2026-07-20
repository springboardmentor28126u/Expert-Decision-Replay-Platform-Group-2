import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import DiscussionTable from "../../components/discussion/DiscussionTable";

import api from "../../services/api";

import "../../styles/discussion.css";


function DiscussionList() {


    const { decisionId } = useParams();


    const [user,setUser] = useState(null);

    const [discussions,setDiscussions] = useState([]);

    const [search,setSearch] = useState("");

    const [loading,setLoading] = useState(true);



    useEffect(()=>{

        loadData();

    },[decisionId]);



    const loadData = async()=>{

        try{


            const userResponse =
            await api.get("/users/me");


            const discussionResponse =
            await api.get(
                `/decisions/${decisionId}/discussion`
            );


            setUser(userResponse.data);

            setDiscussions(
                discussionResponse.data
            );


        }
        catch(error){

            console.log(error);

        }
        finally{

            setLoading(false);

        }

    };



    if(loading){

        return <h2>Loading...</h2>;

    }



    const filteredDiscussions =
    discussions.filter((discussion)=>

        discussion.title
        .toLowerCase()
        .includes(search.toLowerCase())

    );



    return(

        <DashboardLayout user={user}>


            <div className="discussion-page">


                <div className="discussion-header">


                    <div>

                        <h1>Discussions</h1>

                        <p>
                            Manage discussions related to decisions.
                        </p>

                    </div>


                    <Link
                        to={`/decisions/${decisionId}/create-discussion`}
                        className="approve-btn"
                    >
                        + Create Discussion
                    </Link>


                </div>




                <div className="discussion-search">


                    <input

                        type="text"

                        placeholder="Search discussion..."

                        value={search}

                        onChange={(e)=>
                            setSearch(e.target.value)
                        }

                    />


                </div>




                <DiscussionTable

                    discussions={filteredDiscussions}

                />



            </div>


        </DashboardLayout>

    );

}


export default DiscussionList;