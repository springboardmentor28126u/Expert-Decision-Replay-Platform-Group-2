import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

import "../../styles/addAlternative.css";

function EditAlternative() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        pros: "",
        cons: "",
        score: ""
    });

    useEffect(() => {
        loadAlternative();
    }, []);

    const loadAlternative = async () => {

        try {

            const response = await api.get(`/alternatives/${id}`);

            setFormData({
                title: response.data.title || "",
                description: response.data.description || "",
                pros: response.data.pros || "",
                cons: response.data.cons || "",
                score: response.data.score || ""
            });

        } catch (error) {

            console.error(error);
            alert("Failed to load alternative.");

        }

    };

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await api.patch(`/alternatives/${id}`, formData);

            alert("Alternative Updated Successfully");

            navigate(-1);

        } catch (error) {

            console.error(error);

            alert("Failed to Update Alternative");

        }

    };

    return (

        <DashboardLayout>

            <div className="add-alternative-page">

                <h2>Edit Alternative</h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Title"
                        required
                    />

                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description"
                    />

                    <input
                        type="text"
                        name="pros"
                        value={formData.pros}
                        onChange={handleChange}
                        placeholder="Pros"
                    />

                    <input
                        type="text"
                        name="cons"
                        value={formData.cons}
                        onChange={handleChange}
                        placeholder="Cons"
                    />

                    <input
                        type="number"
                        name="score"
                        value={formData.score}
                        onChange={handleChange}
                        placeholder="Score"
                    />

                    <button type="submit">
                        Update Alternative
                    </button>

                </form>

            </div>

        </DashboardLayout>

    );

}

export default EditAlternative;