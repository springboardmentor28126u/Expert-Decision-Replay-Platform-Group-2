import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import StatusBadge from './StatusBadge';
import Badge from '../common/Badge';
import { Decision } from '../../types';
import { formatDate } from '../../utils/helpers';

interface DecisionCardProps {
  decision: Decision;
}

const DecisionCard: React.FC<DecisionCardProps> = ({ decision }) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(`/dashboard/decisions/${decision.id}`)}
      className="flex flex-col justify-between h-full animate-fadeIn"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <StatusBadge status={decision.status} />
          {decision.category && <Badge variant="secondary">{decision.category}</Badge>}
        </div>

        <h3 className="text-lg font-bold text-text mb-2 line-clamp-1 group-hover:text-primary-light">
          {decision.title || 'Untitled Decision'}
        </h3>

        <p className="text-sm text-text-secondary line-clamp-3 mb-6">
          {decision.description || 'No description provided.'}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-light uppercase border border-primary/20">
            {decision.creator?.username?.charAt(0) || 'U'}
          </div>
          <span className="text-xs text-text-muted">
            By {decision.creator?.username || 'Unknown'}
          </span>
        </div>

        <span className="text-xs text-text-muted">
          {decision.created_at ? formatDate(decision.created_at) : ''}
        </span>
      </div>
    </Card>
  );
};

export default DecisionCard;
