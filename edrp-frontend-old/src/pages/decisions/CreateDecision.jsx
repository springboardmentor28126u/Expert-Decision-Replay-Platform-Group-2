import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionForm from "../../components/decision/DecisionForm";

import api from "../../services/api";

import "../../styles/decision.css";

function CreateDecision() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {

        loadUser();
        loadCategories();

    }, []);

    const loadUser = async () => {

        try {

            const response = await api.get("/users/me");

            setUser(response.data);

        } catch (err) {

            console.error(err);

        }

    };

    const loadCategories = async () => {

        try {

            const response = await api.get("/categories");

            setCategories(response.data);

        } catch (err) {

            console.error(err);

        }

    };

    const handleCreate = async (formData) => {

        try {

            const payload = {

                title: formData.title,
                description: formData.description,
                status: formData.status.toLowerCase().replace(" ", "_"),
                owner_id: user.id,
                category_id: Number(formData.category_id),

            };

            await api.post("/decisions", payload);

            alert("Decision Created Successfully!");

            navigate("/decisions");

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Failed to create decision."
            );

        }

    };

    if (!user) {

        return <h2>Loading...</h2>;

    }

    return (

        <DashboardLayout user={user}>

            <div className="page-header">

                <h2>Create Decision</h2>

            </div>

            <DecisionForm
                initialData={{}}
                categories={categories}
                onSubmit={handleCreate}
                buttonText="Create Decision"
            />

        </DashboardLayout>

    );

}

export default CreateDecision;