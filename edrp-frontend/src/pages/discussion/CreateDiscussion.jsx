import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import dummyUser from "../../data/dummyUser";

import "../../styles/discussion.css";

function CreateDiscussion() {

    const navigate = useNavigate();
    const user = dummyUser;

    const [formData, setFormData] = useState({
        title: "",
        decision: "",
        description: ""
    });

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        console.log("Discussion Created:", formData);

        alert("Discussion created successfully!");

        navigate("/discussions");

    };

    return (

        <DashboardLayout user={user}>

            <div className="discussion-page">

                <div className="discussion-header">

                    <div>

                        <h1>Create Discussion</h1>

                        <p>
                            Start a new discussion for a decision.
                        </p>

                    </div>

                </div>


                <form
                    className="profile-card"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label>Discussion Title</label>

                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter discussion title"
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label>Related Decision</label>

                        <select
                            name="decision"
                            value={formData.decision}
                            onChange={handleChange}
                            required
                        >

                            <option value="">
                                Select Decision
                            </option>

                            <option value="Cloud Migration">
                                Cloud Migration
                            </option>

                            <option value="Database Upgrade">
                                Database Upgrade
                            </option>

                            <option value="Security Enhancement">
                                Security Enhancement
                            </option>

                        </select>

                    </div>


                    <div className="form-group">

                        <label>Description</label>

                        <textarea
                            name="description"
                            rows="5"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter discussion details..."
                            required
                        />

                    </div>


                    <div className="form-buttons">

                        <button
                            type="submit"
                            className="approve-btn"
                        >
                            Create Discussion
                        </button>

                        <button
                            type="button"
                            className="reject-btn"
                            onClick={() => navigate("/discussions")}
                        >
                            Cancel
                        </button>

                    </div>

                </form>

            </div>

        </DashboardLayout>

    );

}

export default CreateDiscussion;