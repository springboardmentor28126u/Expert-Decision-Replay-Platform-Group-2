import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {

  // Get token from localStorage
  const token = localStorage.getItem("token");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists, show the protected page
  return children;
}

export default ProtectedRoute;