import axios from "axios";

export async function getEmployeeDashboard(token) {
  const res = await axios.get("http://127.0.0.1:8000/dashboard/employee", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getReviewerDashboard(token) {
  const res = await axios.get("http://127.0.0.1:8000/dashboard/reviewer", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getManagerDashboard(token) {
  const res = await axios.get("http://127.0.0.1:8000/dashboard/manager", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getAdminDashboard(token) {
  const res = await axios.get("http://127.0.0.1:8000/dashboard/admin", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
