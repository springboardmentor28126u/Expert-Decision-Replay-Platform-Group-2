import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/category.css";

function CategoryDetails() {

    const category = {
        id: 1,
        name: "Technology",
        description:
            "This category contains decisions related to cloud computing, infrastructure, software development, cybersecurity, and other technology initiatives."
    };

    return (

        <DashboardLayout>

            <div className="category-page">

                <div className="page-header">

                    <div>

                        <h2>Category Details</h2>

                        <p>
                            View complete information about this category.
                        </p>

                    </div>

                </div>

                <div className="profile-card">

                    <p>
                        <strong>ID :</strong> {category.id}
                    </p>

                    <p>
                        <strong>Category Name :</strong> {category.name}
                    </p>

                    <p>
                        <strong>Description :</strong>
                    </p>

                    <p className="category-description">
                        {category.description}
                    </p>

                </div>

                <div className="form-buttons">

                    <Link
                        to="/categories"
                        className="approve-btn"
                    >
                        Back to Categories
                    </Link>

                </div>

            </div>

        </DashboardLayout>

    );

}

export default CategoryDetails;