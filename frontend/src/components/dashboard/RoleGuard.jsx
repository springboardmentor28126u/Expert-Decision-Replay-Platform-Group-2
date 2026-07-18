import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const roleHierarchy = {
  Employee: 0,
  Reviewer: 1,
  Manager: 2,
  Administrator: 3,
};

const dashboardRoles = {
  '/dashboard/employee': 0,
  '/dashboard/manager': 2,
  '/dashboard/admin': 3,
};

export function RoleGuard({ children, requiredRole }) {
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

  const userRoleLevel = roleHierarchy[user.role?.name] ?? -1;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;

  if (userRoleLevel < requiredLevel) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function getDashboardPath(roleName) {
  const level = roleHierarchy[roleName] ?? 0;
  if (level >= 3) return '/dashboard/admin';
  if (level >= 2) return '/dashboard/manager';
  return '/dashboard/employee';
}
