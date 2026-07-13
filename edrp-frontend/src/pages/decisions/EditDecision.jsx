import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";
import dummyUser from "../../data/dummyUser";


function EditDecision() {
    const user = dummyUser;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({

        title: "Cloud Migration",

        description:
            "Migrate company infrastructure to cloud platform.",

        category: "Technology",

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

        alert("Decision Updated Successfully");

        navigate("/decisions");

    };

    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">

                    <h1>
                        Edit Decision
                    </h1>

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
                    />

                    <label>
                        Description
                    </label>

                    <textarea
                        rows="5"
                        name="description"
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

                        <option>
                            Technology
                        </option>

                        <option>
                            AI
                        </option>

                        <option>
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
                        className="approve-btn"
                        type="submit"
                    >

                        Update Decision

                    </button>

                </form>

            </div>

        </DashboardLayout>

    );

}

export default EditDecision;