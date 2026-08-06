import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

import CommentList from "../../components/discussion/CommentList";
import MeetingNotes from "../../components/discussion/MeetingNotes";
import RationaleList from "../../components/discussion/RationaleList";
import DiscussionAttachmentList from "../../components/discussion/DiscussionAttachmentList";

import api from "../../services/api";

import "../../styles/discussion.css";


function DiscussionDetails(){

    const { decisionId, id } = useParams();
    console.log("Decision ID:", decisionId);
    console.log("Discussion ID:", id);
    const [user,setUser] = useState(null);
    const [discussion,setDiscussion] = useState(null);
    const [loading,setLoading] = useState(true);



    useEffect(()=>{

        loadData();

    },[id]);



    const loadData = async()=>{

        try{


            const [userRes, discussionRes] = await Promise.all([

                api.get("/users/me"),

                api.get(`/discussion/${id}`)

            ]);



            setUser(userRes.data);

            setDiscussion(discussionRes.data);


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



    if(!discussion || !user){

        return <h2>Discussion Not Found</h2>;

    }



    return(

        <DashboardLayout user={user}>


            <div className="discussion-page">


                <h1>Discussion Details</h1>



                <div className="dashboard-section">


                    <h2>Discussion Information</h2>


                    <div className="profile-card">


                        <p>
                            <strong>Title :</strong>
                            {discussion.title}
                        </p>


                        <p>
                            <strong>Decision ID :</strong>
                            {discussion.decision_id}
                        </p>


                        <p>
                            <strong>Created By :</strong>
                            {discussion.created_by}
                        </p>


                        <p>
                            <strong>Created At :</strong>

                            {
                            new Date(
                            discussion.created_at
                            ).toLocaleString()
                            }

                        </p>


                    </div>


                </div>



                <div className="dashboard-section">

                    <CommentList
                    discussionId={discussion.id}
                    />

                </div>



                <div className="dashboard-section">

                    <MeetingNotes
                    discussionId={discussion.id}
                    />

                </div>



                <div className="dashboard-section">

                    <RationaleList
                    decisionId={discussion.decision_id}
                    />

                </div>



                <div className="dashboard-section">

                    <DiscussionAttachmentList
                    discussionId={discussion.id}
                    />

                </div>
              
                <Link
                    to={`/decisions/${discussion.decision_id}/discussion`}
                    className="approve-btn"
                >
                    Back to Discussions
                </Link>


            </div>


        </DashboardLayout>


    );


}


export default DiscussionDetails;