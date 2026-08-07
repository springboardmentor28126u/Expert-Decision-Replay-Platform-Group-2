import { useEffect, useState } from "react";
import api from "../services/api";

function RecentNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

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
      className="card border-0 shadow-lg mt-4"
      style={{ borderRadius: "18px" }}
    >
      <div className="card-body">
        <h4 className="fw-bold mb-3">🔔 Latest Notifications</h4>

        {notifications.length === 0 ? (
          <p className="text-muted">No notifications available.</p>
        ) : (
          <div className="list-group list-group-flush">
            {notifications.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="list-group-item d-flex justify-content-between"
              >
                <div>{item.message}</div>

                <small className="text-muted">
                  {new Date(item.created_at).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentNotifications;