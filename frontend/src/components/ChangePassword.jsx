import { useState } from "react";
import apiClient, { authHeaders } from "../api/client";
import Button from "./ui/Button";

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
      // 204 No Content on success — there's no response body/message to
      // read, so the success text is a fixed string here instead.
      await apiClient.post(
        "/api/v1/users/me/password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        authHeaders(token)
      );
      setIsError(false);
      setMessage("Password updated successfully.");
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
            aria-label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <input
            type="password"
            placeholder="New password (min. 8 characters)"
            aria-label="New password, minimum 8 characters"
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
            aria-label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="primary" style={{ width: "100%" }}>Update password</Button>
      </form>
      {message && (
        <div className={`auth-message ${isError ? "error" : "success"}`} style={{ marginTop: "12px" }} role="status">
          {message}
        </div>
      )}
    </div>
  );
}

export default ChangePassword;