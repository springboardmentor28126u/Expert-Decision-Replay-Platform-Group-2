import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

const ROLES = ["Employee", "Reviewer", "Manager", "Administrator"];

function Users() {
  const [users, setUsers] = useState([]);
  const [editedRoles, setEditedRoles] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await api.get("/users/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.detail || "Failed to load users");
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setEditedRoles({
      ...editedRoles,
      [userId]: newRole,
    });
  };

  const handleSave = async (userId) => {
    const newRole = editedRoles[userId];

    if (!newRole) return;

    try {
      const token = sessionStorage.getItem("token");

      await api.put(`/users/${userId}/role`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          role: newRole,
        },
      });

      alert("Role updated successfully");
      fetchUsers();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.detail || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = sessionStorage.getItem("token");

      await api.put(
        `/users/${userId}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("User status updated successfully");
      fetchUsers();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.detail || "Failed to update status");
    }
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div
          className="card border-0 shadow-lg"
          style={{ borderRadius: "20px" }}
        >
          <div className="card-header bg-dark text-white">
            <h3 className="mb-0">👤 Manage Users</h3>
          </div>

          <div className="card-body">
            <table className="table table-hover table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Change Role</th>
                  <th>Role Action</th>
                  <th>Activate / Deactivate</th>
                </tr>
              </thead>

              <tbody>
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.full_name}</td>
                      <td>{u.email}</td>

                      <td>
                        <span className="badge bg-primary">
                          {u.role}
                        </span>
                      </td>

                      <td>
                        {u.is_active ? (
                          <span className="badge bg-success">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-danger">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td>
                        <select
                          className="form-select"
                          defaultValue={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleSave(u.id)}
                        >
                          Save
                        </button>
                      </td>

                      <td>
                        <button
                          className={`btn btn-sm ${
                            u.is_active
                              ? "btn-danger"
                              : "btn-success"
                          }`}
                          onClick={() =>
                            handleToggleStatus(u.id)
                          }
                        >
                          {u.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No Users Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Users;
