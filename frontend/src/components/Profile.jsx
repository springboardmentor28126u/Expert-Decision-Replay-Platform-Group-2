import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/Profile.css";

function Profile() {

    const [user, setUser] = useState(null);

    useEffect(() => {

        const token = localStorage.getItem("token");

        axios.get("http://127.0.0.1:8000/profile/", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            setUser(res.data);
        })
        .catch(err => {
            console.log(err);
        });

    }, []);

    if (!user) return <h2>Loading...</h2>;

    return (
        <div className="profile-page">

            <div className="profile-card">

                <h1>{user.full_name}</h1>

                <h3>{user.role}</h3>

                <hr/>

                <table>

                    <tbody>

                        <tr>
                            <td><b>Full Name</b></td>
                            <td>{user.full_name}</td>
                        </tr>

                        <tr>
                            <td><b>Email</b></td>
                            <td>{user.email}</td>
                        </tr>

                        <tr>
                            <td><b>Role</b></td>
                            <td>{user.role}</td>
                        </tr>

                        <tr>
                            <td><b>Joined Date</b></td>
                            <td>
                                {new Date(user.joined_date).toLocaleDateString()}
                            </td>
                        </tr>

                    </tbody>

                </table>

                <div className="buttons">

                    <button>Edit Profile</button>

                    <button>Change Password</button>

                </div>

                <Link to="/dashboard">
                    ← Dashboard
                </Link>

            </div>

        </div>
    );
}

export default Profile;