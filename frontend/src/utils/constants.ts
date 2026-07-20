import { DecisionStatus, UserRole } from '../types';

export const DECISION_STATUSES: DecisionStatus[] = [
  'Draft',
  'Under Review',
  'Approved',
  'Rejected',
  'Archived',
];

export const USER_ROLES: UserRole[] = [
  'Employee',
  'Reviewer',
  'Manager',
  'Administrator',
];

export const DECISION_CATEGORIES = [
  'Architecture',
  'Security',
  'Database',
  'Frontend',
  'Backend',
  'Infrastructure',
  'HR',
  'Finance',
  'Other',
];
