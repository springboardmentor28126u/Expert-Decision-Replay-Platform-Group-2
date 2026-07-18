const mockApprovals = [
  { id: '101', title: 'New Hire Request - Engineering', submitter: 'Frank Wilson', team: 'Engineering', timestamp: '2026-06-28T08:00:00Z', status: 'under_review' },
  { id: '102', title: 'Budget Increase - Marketing', submitter: 'Grace Kim', team: 'Marketing', timestamp: '2026-06-27T13:30:00Z', status: 'under_review' },
  { id: '103', title: 'Policy Exception - Travel', submitter: 'Henry Chen', team: 'Operations', timestamp: '2026-06-26T15:45:00Z', status: 'under_review' },
];

export const approvalService = {
  getPendingApprovals: async () => {
    return { items: mockApprovals, total: mockApprovals.length, page: 1, size: 10, pages: 1 };
  },
  getPendingCount: async () => {
    return { total: mockApprovals.length };
  },
};
