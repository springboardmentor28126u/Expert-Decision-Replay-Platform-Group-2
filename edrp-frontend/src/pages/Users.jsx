import { useState } from "react";
import "../styles/dashboard.css";


function Users() {


    const [users, setUsers] = useState([

        {
            id: 1,
            name: "Raj Upadhyay",
            email: "raj@gmail.com",
            role: "Administrator"
        },

        {
            id: 2,
            name: "Anjali",
            email: "anjali@gmail.com",
            role: "Employee"
        },

        {
            id: 3,
            name: "Rahul",
            email: "rahul@gmail.com",
            role: "Manager"
        }

    ]);



    // Store selected dropdown values
    const [selectedRoles, setSelectedRoles] = useState({});



    const roles = [

        "Employee",
        "Reviewer",
        "Manager",
        "Administrator"

    ];





    // Update role in UI
    const changeRole = (id, newRole) => {


        const updatedUsers = users.map((user)=>{


            if(user.id === id){


                return {

                    ...user,

                    role: newRole

                };

            }


            return user;


        });



        setUsers(updatedUsers);


    };





    return (

        <div className="dashboard-page">



            <div className="page-header">


                <h1>
                    Users Management
                </h1>


                <p>
                    Manage users and assign roles
                </p>


            </div>






            <div className="dashboard-section">


                <h2>
                    All Users
                </h2>




                <table className="decision-table">


                    <thead>


                        <tr>


                            <th>
                                Name
                            </th>


                            <th>
                                Email
                            </th>


                            <th>
                                Current Role
                            </th>


                            <th>
                                Change Role
                            </th>


                            <th>
                                Action
                            </th>


                        </tr>


                    </thead>






                    <tbody>


                    {

                        users.map((user)=>(


                            <tr key={user.id}>


                                <td>
                                    {user.name}
                                </td>



                                <td>
                                    {user.email}
                                </td>




                                <td>
                                    {user.role}
                                </td>





                                <td>


                                    <select

                                    value={
                                        selectedRoles[user.id] || user.role
                                    }


                                    onChange={(e)=>{


                                        setSelectedRoles({


                                            ...selectedRoles,


                                            [user.id]: e.target.value


                                        });


                                    }}

                                    >



                                    {

                                        roles.map((role)=>(


                                            <option

                                            key={role}

                                            value={role}

                                            >

                                                {role}

                                            </option>


                                        ))

                                    }


                                    </select>



                                </td>






                                <td>


                                    <button

                                    className="approve-btn"


                                    onClick={()=>{


                                        changeRole(

                                            user.id,

                                            selectedRoles[user.id]

                                        );


                                    }}


                                    >

                                        Update Role

                                    </button>



                                </td>




                            </tr>


                        ))

                    }


                    </tbody>



                </table>




            </div>



        </div>

    );

}



export default Users;