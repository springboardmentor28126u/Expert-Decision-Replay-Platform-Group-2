import { useState } from "react";
import axios from "axios";

function ChangePassword({ token }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("New password and confirm password do not match.");
      return;
    }

    try {
      const res = await axios.put(
        "http://127.0.0.1:8000/me/change-password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsError(false);
      setMessage(res.data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setIsError(true);
      setMessage(err?.response?.data?.detail || "Something went wrong.");
    }
  };

  return (
    <div className="dash-card">
      <p className="dash-card-label" style={{ marginBottom: "12px" }}>Change Password</p>
      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <input
            type="password"
            placeholder="New password (min. 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="auth-field">
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Update password</button>
      </form>
      {message && (
        <div className={`auth-message ${isError ? "error" : "success"}`} style={{ marginTop: "12px" }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default ChangePassword;