import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/category.css";

function CreateCategory() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
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

        console.log("Category Created:", formData);

        // Backend API
        // POST /categories

        alert("Category created successfully!");

        navigate("/categories");

    };

    return (

        <DashboardLayout>

            <div className="category-page">

                <div className="page-header">

                    <div>

                        <h2>Create Category</h2>

                        <p>
                            Add a new decision category.
                        </p>

                    </div>

                </div>

                <form
                    className="category-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label>
                            Category Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            placeholder="Enter category name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            placeholder="Enter description"
                            rows="5"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-buttons">

                        <button
                            type="submit"
                            className="approve-btn"
                        >
                            Save Category
                        </button>

                        <button
                            type="button"
                            className="reject-btn"
                            onClick={() => navigate("/categories")}
                        >
                            Cancel
                        </button>

                    </div>

                </form>

            </div>

        </DashboardLayout>

    );

}

export default CreateCategory;