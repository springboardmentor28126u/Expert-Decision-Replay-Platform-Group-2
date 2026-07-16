import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import CategoryTable from "../../components/category/CategoryTable";
import "../../styles/category.css";

function CategoryList() {

    const [search, setSearch] = useState("");

    const categories = [
        {
            id: 1,
            name: "Technology",
            description: "Cloud and Infrastructure Decisions"
        },
        {
            id: 2,
            name: "Finance",
            description: "Budget and Investment Decisions"
        },
        {
            id: 3,
            name: "Human Resource",
            description: "Recruitment and Employee Policies"
        }
    ];

    const filteredCategories = categories.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <DashboardLayout>

            <div className="category-page">

                <div className="page-header">

                    <div>

                        <h2>Categories</h2>

                        <p>
                            Manage all decision categories.
                        </p>

                    </div>

                    <Link
                        to="/categories/create"
                        className="add-btn"
                    >
                        + Add Category
                    </Link>

                </div>

                <div className="search-bar">

                    <input
                        type="text"
                        placeholder="Search category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                </div>

                <CategoryTable
                    categories={filteredCategories}
                />

            </div>

        </DashboardLayout>

    );

}

export default CategoryList;