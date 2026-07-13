import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";
import dummyUser from "../../data/dummyUser";

function CreateDecision() {
    const user = dummyUser;

    const navigate = useNavigate();

    const [formData, setFormData] = useState({

        title: "",
        description: "",
        category: "",
        status: "Draft"

    });

    const handleChange = (e) => {

        setFormData({

            ...formData,
            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        console.log(formData);

        alert("Decision Created Successfully");

        navigate("/decisions");

    };

    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">

                    <h1>Create Decision</h1>

                </div>

                <form
                    className="decision-form"
                    onSubmit={handleSubmit}
                >

                    <label>

                        Decision Title

                    </label>

                    <input

                        type="text"

                        name="title"

                        value={formData.title}

                        onChange={handleChange}

                        required

                    />

                    <label>

                        Description

                    </label>

                    <textarea

                        name="description"

                        rows="5"

                        value={formData.description}

                        onChange={handleChange}

                    />

                    <label>

                        Category

                    </label>

                    <select

                        name="category"

                        value={formData.category}

                        onChange={handleChange}

                    >

                        <option value="">

                            Select Category

                        </option>

                        <option value="Technology">

                            Technology

                        </option>

                        <option value="AI">

                            AI

                        </option>

                        <option value="Business">

                            Business

                        </option>

                    </select>

                    <label>

                        Status

                    </label>

                    <select

                        name="status"

                        value={formData.status}

                        onChange={handleChange}

                    >

                        <option>

                            Draft

                        </option>

                        <option>

                            In Review

                        </option>

                        <option>

                            Finalized

                        </option>

                    </select>

                    <button
                        type="submit"
                        className="approve-btn"
                    >

                        Create Decision

                    </button>

                </form>

            </div>

        </DashboardLayout>

    );

}

export default CreateDecision;