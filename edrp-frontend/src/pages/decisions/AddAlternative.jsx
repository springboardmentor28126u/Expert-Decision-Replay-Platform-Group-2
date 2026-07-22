import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

import "../../styles/addAlternative.css";

function AddAlternative() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        pros: "",
        cons: "",
        score: ""
    });

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await api.post(
                `/decisions/${id}/alternatives`,
                formData
            );

            alert("Alternative Added Successfully");

            navigate(`/decisions/${id}/alternatives`);

        } catch (error) {

            console.log("Status:", error.response?.status);
            console.log("Data:", error.response?.data);

            alert(JSON.stringify(error.response?.data));

        }

        

    };

    return (

        <DashboardLayout>

            <div className="add-alternative-page">

                <h2>Add Alternative</h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="title"
                        placeholder="Title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Description"
                        value={formData.description}
                        onChange={handleChange}
                    />

                    <input
                        type="text"
                        name="pros"
                        placeholder="Pros"
                        value={formData.pros}
                        onChange={handleChange}
                    />

                    <input
                        type="text"
                        name="cons"
                        placeholder="Cons"
                        value={formData.cons}
                        onChange={handleChange}
                    />

                    <input
                        type="number"
                        name="score"
                        placeholder="Score"
                        value={formData.score}
                        onChange={handleChange}
                    />

                    <button type="submit">
                        Save Alternative
                    </button>

                </form>

            </div>

        </DashboardLayout>

    );

}

export default AddAlternative;