const mockAuditLogs = [
  { id: '201', title: 'User account created', submitter: 'System', team: null, timestamp: '2026-06-28T12:00:00Z', status: 'approved' },
  { id: '202', title: 'Role changed to Manager', submitter: 'Admin User', team: 'Administration', timestamp: '2026-06-28T11:30:00Z', status: 'approved' },
  { id: '203', title: 'Decision approved: Q3 Budget', submitter: 'Jane Admin', team: 'Finance', timestamp: '2026-06-28T10:00:00Z', status: 'approved' },
  { id: '204', title: 'Team created: Data Science', submitter: 'Admin User', team: 'Administration', timestamp: '2026-06-27T16:00:00Z', status: 'approved' },
  { id: '205', title: 'Decision rejected: Vendor Onboarding', submitter: 'Jane Admin', team: 'Procurement', timestamp: '2026-06-27T14:30:00Z', status: 'rejected' },
  { id: '206', title: 'User deactivated: bob@example.com', submitter: 'Admin User', team: 'Administration', timestamp: '2026-06-27T09:15:00Z', status: 'approved' },
  { id: '207', title: 'Team updated: Engineering', submitter: 'Admin User', team: 'Administration', timestamp: '2026-06-26T11:00:00Z', status: 'approved' },
  { id: '208', title: 'Decision created: Remote Work Policy', submitter: 'Carol Davis', team: 'HR', timestamp: '2026-06-26T09:00:00Z', status: 'draft' },
  { id: '209', title: 'Role assigned: Reviewer to eve@co.com', submitter: 'Jane Admin', team: 'Administration', timestamp: '2026-06-25T15:00:00Z', status: 'approved' },
  { id: '210', title: 'Decision approved: Infrastructure Upgrade', submitter: 'Jane Admin', team: 'Engineering', timestamp: '2026-06-25T12:00:00Z', status: 'approved' },
];

export const auditLogService = {
  getRecentActivity: async () => {
    return { items: mockAuditLogs, total: mockAuditLogs.length, page: 1, size: 10, pages: 1 };
  },
};
