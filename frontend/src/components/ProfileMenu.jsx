import { useEffect, useRef, useState } from "react";
import { Settings, LogOut } from "lucide-react";

function ProfileMenu({ profile, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Click-toggle rather than hover-only so the menu works for keyboard and
  // touch users, not just mouse hover. Closes on outside click or Escape,
  // returning focus to the trigger in the Escape case so keyboard users
  // don't lose their place.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const goTo = (view) => {
    setOpen(false);
    onNavigate?.(view);
  };

  return (
    <div className="profile-menu" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className="profile-menu-trigger"
        onClick={() => setOpen((v) => !v)}
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

          <div className="profile-menu-dropdown-divider" role="none" />

          <button
            type="button"
            role="menuitem"
            className="profile-menu-dropdown-item"
            onClick={() => goTo("account")}
          >
            <Settings size={15} strokeWidth={1.75} aria-hidden="true" />
            Account Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="profile-menu-dropdown-item danger"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
          >
            <LogOut size={15} strokeWidth={1.75} aria-hidden="true" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
