import { useState } from "react";

function ProfileMenu({ profile, onLogout, onManageAccount }) {
  const [open, setOpen] = useState(false);

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-menu-wrapper">
      <button className="profile-avatar-btn" onClick={() => setOpen(!open)}>
        <span className="profile-avatar">{initials}</span>
      </button>

      {open && (
        <>
          <div className="profile-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="profile-menu-dropdown">
            <div className="profile-menu-header">
              <span className="profile-avatar profile-avatar-lg">{initials}</span>
              <div>
                <p className="profile-menu-name">{profile.full_name}</p>
                <p className="profile-menu-role">{profile.role}</p>
              </div>
            </div>
            <div className="profile-menu-divider" />
            <div className="profile-menu-row">
              <span>Email</span>
              <span>{profile.email}</span>
            </div>
            <div className="profile-menu-row">
              <span>Account created</span>
              <span>{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            <div className="profile-menu-divider" />
            <button className="profile-menu-settings" onClick={onManageAccount}>
             Manage Account
            </button>
            <button className="profile-menu-logout" onClick={onLogout}>
             Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileMenu;