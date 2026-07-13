import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        Checking your session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
