import { useState } from "react";

function ProfileMenu({ profile }) {
  const [open, setOpen] = useState(false);

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="profile-menu"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="profile-menu-trigger"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="profile-menu-avatar-wrap">
          <span className="profile-menu-avatar" aria-hidden="true">{initials}</span>
          <span className="profile-menu-online-dot" aria-hidden="true" />
        </span>
        <span className="profile-menu-identity">
          <span className="profile-menu-name">{profile.full_name}</span>
          <span className="profile-menu-role">{profile.role?.name}</span>
        </span>
      </button>

      {open && (
        <div className="profile-menu-dropdown" role="menu">
          <p className="profile-menu-dropdown-label">Signed in as</p>
          <p className="profile-menu-dropdown-email">{profile.email}</p>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
