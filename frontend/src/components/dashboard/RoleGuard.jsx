import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPathForRole, getRoleLevel } from '../../utils/roles';

export function RoleGuard({ children, requiredRole = 'employee' }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRoleLevel = getRoleLevel(user.role);
  const requiredLevel = getRoleLevel(requiredRole);

  if (userRoleLevel < requiredLevel) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return children;
}

export function getDashboardPath(roleName) {
  return getDashboardPathForRole(roleName);
}
