import DashboardLayout from "../../components/layout/DashboardLayout";
import dummyUser from "../../data/dummyUser";

import CommentList from "../../components/discussion/CommentList";
import MeetingNoteList from "../../components/discussion/MeetingNoteList";
import RationaleList from "../../components/discussion/RationaleList";
import DiscussionAttachmentList from "../../components/discussion/DiscussionAttachmentList";

import "../../styles/discussion.css";

function DiscussionDetails() {

    const user = dummyUser;

    const discussion = {
        id: 1,
        title: "Cloud Migration Discussion",
        decision: "Cloud Migration",
        createdBy: "Raj",
        createdDate: "15 Jul 2026",
        status: "Open",
        description:
            "Discussion regarding migration of on-premise infrastructure to cloud."
    };

    return (

        <DashboardLayout user={user}>

            <div className="discussion-page">

                <div className="discussion-header">

                    <div>

                        <h1>Discussion Details</h1>

                        <p>
                            View discussion information and collaboration history.
                        </p>

                    </div>

                </div>

                {/* Discussion Information */}

                <div className="dashboard-section">

                    <h2>Discussion Information</h2>

                    <div className="profile-card">

                        <p>
                            <strong>Title :</strong> {discussion.title}
                        </p>

                        <p>
                            <strong>Decision :</strong> {discussion.decision}
                        </p>

                        <p>
                            <strong>Created By :</strong> {discussion.createdBy}
                        </p>

                        <p>
                            <strong>Created Date :</strong> {discussion.createdDate}
                        </p>

                        <p>
                            <strong>Status :</strong> {discussion.status}
                        </p>

                        <p>
                            <strong>Description :</strong> {discussion.description}
                        </p>

                    </div>

                </div>

                {/* Comments */}

                <div className="dashboard-section">

                    <CommentList />

                </div>

                {/* Meeting Notes */}

                <div className="dashboard-section">

                    <MeetingNoteList />

                </div>

                {/* Decision Rationale */}

                <div className="dashboard-section">

                    <RationaleList />

                </div>

                {/* Attachments */}

                <div className="dashboard-section">

                    <DiscussionAttachmentList />

                </div>

            </div>

        </DashboardLayout>

    );

}

export default DiscussionDetails;