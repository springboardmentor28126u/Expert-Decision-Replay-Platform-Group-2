export type NormalizedRole = 'employee' | 'reviewer' | 'manager' | 'admin';

const roleAliases: Record<string, NormalizedRole> = {
  employee: 'employee',
  reviewer: 'reviewer',
  manager: 'manager',
  admin: 'admin',
  administrator: 'admin',
  'system administrator': 'admin',
};

const roleHierarchy: Record<NormalizedRole, number> = {
  employee: 0,
  reviewer: 1,
  manager: 2,
  admin: 3,
};

const roleLabels: Record<NormalizedRole, string> = {
  employee: 'Employee',
  reviewer: 'Reviewer',
  manager: 'Manager',
  admin: 'Administrator',
};

export function normalizeRole(roleName?: string | null): NormalizedRole {
  const key = (roleName || '').trim().toLowerCase();
  return roleAliases[key] || 'employee';
}

export function getRoleLevel(roleName?: string | null): number {
  return roleHierarchy[normalizeRole(roleName)];
}

export function getDashboardPathForRole(roleName?: string | null): string {
  const level = getRoleLevel(roleName);
  if (level >= roleHierarchy.admin) return '/dashboard/admin';
  if (level >= roleHierarchy.manager) return '/dashboard/manager';
  return '/dashboard/employee';
}

export function getRoleLabel(roleName?: string | null): string {
  return roleLabels[normalizeRole(roleName)];
}
