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
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <span
            style={{
              position: "absolute",
              bottom: "-1px",
              right: "-1px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#2DD4A7",
              border: "2px solid var(--surface)",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {profile.full_name}
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", textTransform: "capitalize" }}>
            {profile.role?.name}
          </span>
        </div>
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "44px",
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "14px 16px",
            width: "220px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 30,
          }}
        >
          <p style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
            Signed in as
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, wordBreak: "break-all" }}>
            {profile.email}
          </p>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;