import { useEffect, useState } from "react";
import {
  
  FaBell,
  FaEnvelope,
  FaUserCircle,
} from "react-icons/fa";

import api from "../services/api";

export default function Navbar() {
  const [user, setUser] = useState({
    full_name: "",
    role: "",
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchNotifications();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/notifications/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      style={{
        height: "75px",
        background: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 35px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Search Box */}
      <div>
  <h4
    style={{
      fontWeight: "700",
      color: "#1e293b",
      margin: 0,
    }}
  >
    Dashboard
  </h4>

  <small
    style={{
      color: "#64748b",
    }}
  >
    Expert Decision Replay Platform
  </small>
</div>

      {/* Right Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "28px",
        }}
      >
        {/* Notifications */}
        <div
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <FaBell size={22} color="#475569" />

          <span
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              width: "18px",
              height: "18px",
              background: "#ef4444",
              borderRadius: "50%",
              color: "#fff",
              fontSize: "11px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {notifications.length}
          </span>

          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "35px",
                right: 0,
                width: "340px",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                padding: "15px",
                zIndex: 999,
                maxHeight: "350px",
                overflowY: "auto",
              }}
            >
              <h5
                style={{
                  marginBottom: "15px",
                  color: "#1e293b",
                }}
              >
                🔔 Notifications
              </h5>

              {notifications.length === 0 ? (
                <p className="text-muted">
                  No Notifications
                </p>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{ 
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#334155",
                      }}
                    >
                      {item.message}
                    </div>

                    <small
                      style={{
                        color: "#64748b",
                      }}
                    >
                      {new Date(item.created_at).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        {/*<div style={{ position: "relative", cursor: "pointer" }}>
          <FaEnvelope size={22} color="#475569" />

          <span
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              width: "18px",
              height: "18px",
              background: "#3b82f6",
              borderRadius: "50%",
              color: "#fff",
              fontSize: "11px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            5
          </span>
        </div> */}

        {/* User */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FaUserCircle size={42} color="#2563eb" />

          <div>
            <div
              style={{
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              {user.full_name}
            </div>

            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {user.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}