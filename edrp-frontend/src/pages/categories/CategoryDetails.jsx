import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/category.css";

import api from "../../services/api";


function CategoryDetails() {

    const { id } = useParams();

    const [category, setCategory] = useState(null);


    useEffect(() => {

        fetchCategory();

    }, []);



    const fetchCategory = async () => {

        try {

            const response = await api.get(
                `/categories/${id}`
            );

            setCategory(response.data);


        } catch (error) {

            console.error(
                "Category Details Error:",
                error
            );

            alert("Failed to load category");

        }

    };



    if (!category) {

        return (
            <DashboardLayout>
                <h2>Loading...</h2>
            </DashboardLayout>
        );

    }



    return (

        <DashboardLayout>


            <div className="category-page">


                <div className="page-header">

                    <div>

                        <h2>
                            Category Details
                        </h2>

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