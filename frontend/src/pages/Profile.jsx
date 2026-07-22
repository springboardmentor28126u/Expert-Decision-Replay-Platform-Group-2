import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);

    } catch (error) {
      console.log(error);
      alert("Failed to load profile");
    }
  };

  if (!user) {
    return (
      <Layout>
        <h3>Loading...</h3>
      </Layout>
    );
  }

  return (
    <Layout>

      <h2 className="mb-4">My Profile</h2>

      <div className="card shadow">

        <div className="card-header bg-primary text-white">
          <h4>User Information</h4>
        </div>

        <div className="card-body">

          <p><strong>ID:</strong> {user.id}</p>

          <p><strong>Full Name:</strong> {user.full_name}</p>

          <p><strong>Email:</strong> {user.email}</p>

          <p><strong>Role:</strong> {user.role}</p>

        </div>

      </div>

    </Layout>
  );
}

export default Profile;