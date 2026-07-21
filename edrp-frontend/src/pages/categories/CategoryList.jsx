import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import dummyUser from "../../data/dummyUser";

import DashboardLayout from "../../components/layout/Dashboardlayout";
import CategoryTable from "../../components/category/CategoryTable";


function CategoryList() {

    const user = dummyUser;


    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");


    useEffect(() => {

        fetchCategories();

    }, []);



    const fetchCategories = async () => {

        try {

            const res = await api.get("/categories/");

            setCategories(res.data);

        } catch (error) {

            console.error("Category Error:", error);

            alert("Failed to load categories");

        }

    };



    const filteredCategories = categories.filter((item) =>

        item.name
        .toLowerCase()
        .includes(search.toLowerCase())

    );



    return (

        <DashboardLayout user={user}>


            <div className="category-page">


                <div className="page-header">

                    <div>

                        <h2>
                            Categories
                        </h2>

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

                        onChange={(e)=>setSearch(e.target.value)}

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