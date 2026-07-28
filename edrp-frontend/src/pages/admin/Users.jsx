import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/dashboard.css";

function Users() {

    const [users, setUsers] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState({});
    const [loading, setLoading] = useState(true);

    const roles = [
        "Employee",
        "Reviewer",
        "Manager",
        "Administrator"
    ];

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {

        try {

            const response = await api.get("/users");

            setUsers(response.data);

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Failed to load users"
            );

        } finally {

            setLoading(false);

        }

    };

    const changeRole = async (id, newRole) => {

        if (!newRole) {
            alert("Please select a role");
            return;
        }

        try {

            await api.patch(
                `/users/${id}/role?new_role=${newRole}`
            );

            alert("Role updated successfully");

            loadUsers();

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Unable to update role"
            );

        }

    };

    if (loading) {

        return <h2>Loading Users...</h2>;

    }

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

                            <th>Name</th>

                            <th>Email</th>

                            <th>Current Role</th>

                            <th>Change Role</th>

                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            users.map((user) => (

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
                                                selectedRoles[user.id] ||
                                                user.role
                                            }

                                            onChange={(e) =>

                                                setSelectedRoles({

                                                    ...selectedRoles,

                                                    [user.id]: e.target.value

                                                })

                                            }

                                        >

                                            {

                                                roles.map((role) => (

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

                                            onClick={() =>

                                                changeRole(

                                                    user.id,

                                                    selectedRoles[user.id] ||
                                                    user.role

                                                )

                                            }

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