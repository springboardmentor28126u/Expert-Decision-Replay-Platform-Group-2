import React from 'react';
import Badge from '../common/Badge';
import { DecisionStatus } from '../../types';

interface StatusBadgeProps {
  status: DecisionStatus | string | null | undefined;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (!status) return null;

  const variantMap: Record<
    string,
    'draft' | 'under-review' | 'approved' | 'rejected' | 'archived' | 'info'
  > = {
    Draft: 'draft',
    'Under Review': 'under-review',
    Approved: 'approved',
    Rejected: 'rejected',
    Archived: 'archived',
    Pending: 'under-review',
  };

  const variant = variantMap[status] || 'info';

  return <Badge variant={variant as any}>{status}</Badge>;
};

export default StatusBadge;
