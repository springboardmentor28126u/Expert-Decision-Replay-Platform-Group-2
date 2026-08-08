import { Lock } from "lucide-react";
import "../styles/styles.css";

// Self-service password reset isn't available — there's no email/reset
// backend for it yet. Rather than fake a "reset link sent" flow that goes
// nowhere, this is an honest dead end that points the user at their admin.
function ForgotPassword({ onSwitch }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">Expert Decision Replay Platform</p>
        <h2 className="auth-title">Reset your password</h2>

        <div className="auth-empty-state">
          <span className="auth-empty-icon" aria-hidden="true"><Lock size={22} strokeWidth={1.75} /></span>
          <p>
            Self-service password reset isn't available yet. Please contact your
            organization's administrator to have your password reset.
          </p>
        </div>

        <div className="auth-switch">
          <button onClick={onSwitch}>Back to login</button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
