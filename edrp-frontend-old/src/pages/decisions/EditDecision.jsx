import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionForm from "../../components/decision/DecisionForm";

import api from "../../services/api";

import "../../styles/decision.css";

function EditDecision() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [decision, setDecision] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {

        try {

            // Current User
            const userRes = await api.get("/users/me");
            setUser(userRes.data);

            // Categories
            const categoryRes = await api.get("/categories");
            setCategories(categoryRes.data);

            // Decision Details
            const decisionRes = await api.get(`/decisions/${id}`);
            setDecision(decisionRes.data);

        } catch (err) {

            console.error(err);
            alert(
                err.response?.data?.detail ||
                "Unable to load decision."
            );

            navigate("/decisions");

        } finally {

            setLoading(false);

        }

    };

    const handleUpdate = async (formData) => {

        try {

            await api.patch(`/decisions/${id}`, {

                title: formData.title,
                description: formData.description,
                status: formData.status

            });

            // Update Category
            if (formData.category_id) {

                await api.patch(
                    `/decisions/${id}/category`,
                    {
                        category_id: Number(formData.category_id)
                    }
                );

            }

            alert("Decision Updated Successfully");

            navigate("/decisions");

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Unable to update decision."
            );

        }

    };

    if (loading) {

        return <h2>Loading...</h2>;

    }

    if (!decision) {

        return (
            <DashboardLayout user={user}>
                <h2>Decision Not Found</h2>
            </DashboardLayout>
        );

    }

    return (

        <DashboardLayout user={user}>

            <div className="page-header">

                <h2>Edit Decision</h2>

            </div>

            <DecisionForm

                initialData={decision}

                categories={categories}

                onSubmit={handleUpdate}

                buttonText="Update Decision"

            />

        </DashboardLayout>

    );

}

export default EditDecision;