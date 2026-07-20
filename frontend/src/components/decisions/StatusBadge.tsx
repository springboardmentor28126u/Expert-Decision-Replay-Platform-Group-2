import React from 'react';
import Badge from '../common/Badge';
import { DecisionStatus } from '../../types';

interface StatusBadgeProps {
  status: DecisionStatus | null | undefined;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (!status) return null;

  const variantMap: Record<
    DecisionStatus,
    'draft' | 'under-review' | 'approved' | 'rejected' | 'archived'
  > = {
    Draft: 'draft',
    'Under Review': 'under-review',
    Approved: 'approved',
    Rejected: 'rejected',
    Archived: 'archived',
  };

  return <Badge variant={variantMap[status]}>{status}</Badge>;
};

export default StatusBadge;
