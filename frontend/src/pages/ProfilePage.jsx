import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as usersApi from "../api/users";

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const me = await usersApi.getCurrentUser();

        setUser(me);

        setProfile({
          full_name: me.full_name || "",
          email: me.email || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(e) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  }

  async function saveProfile() {
    try {
      const updated = await usersApi.updateCurrentUser(profile);
      setUser(updated);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage("Failed to update profile.");
    }
  }

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #ddd",
        borderRadius: 10,
      }}
    >
      <h2>My Profile</h2>

      <div style={{ marginBottom: 16 }}>
        <label>Name</label>

        <input
          name="full_name"
          value={profile.full_name}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Email</label>

        <input
          name="email"
          value={profile.email}
          disabled
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
          }}
        />
      </div>

      <button onClick={saveProfile}>
        Save
      </button>

      <button
        onClick={logout}
        style={{
          marginLeft: 10,
        }}
      >
        Logout
      </button>

      {message && (
        <p
          style={{
            marginTop: 20,
            color: "green",
          }}
        >
          {message}
        </p>
      )}

      {user?.role && (
        <p style={{ marginTop: 20 }}>
        <strong>Role:</strong> {user.role.name}
        </p>
      )}
    </div>
  );
}