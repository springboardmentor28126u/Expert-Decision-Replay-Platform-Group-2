import { useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import DiscussionTable from "../../components/discussion/DiscussionTable";

import dummyUser from "../../data/dummyUser";
import dummyDiscussions from "../../data/dummyDiscussions";

import "../../styles/discussion.css";

function DiscussionList() {

    const user = dummyUser;

    const [search, setSearch] = useState("");

    const filteredDiscussions = dummyDiscussions.filter((discussion) =>
        discussion.title.toLowerCase().includes(search.toLowerCase())
    );

    return (

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
                        to="/discussions/create"
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
                        onChange={(e) => setSearch(e.target.value)}
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