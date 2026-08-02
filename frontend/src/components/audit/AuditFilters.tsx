import React from 'react';
import { User } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';

export const ACTION_CATEGORIES = [
  {
    category: 'Authentication',
    actions: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT'],
  },
  {
    category: 'Decision Workflow',
    actions: [
      'DECISION_CREATED',
      'DECISION_UPDATED',
      'DECISION_SUBMITTED',
      'DECISION_APPROVED',
      'DECISION_REJECTED',
      'DECISION_DELETED',
    ],
  },
  {
    category: 'Decision Replay',
    actions: ['REPLAY_STARTED', 'REPLAY_COMPLETED'],
  },
  {
    category: 'Collaboration',
    actions: [
      'DISCUSSION_CREATED',
      'DISCUSSION_COMMENT_ADDED',
      'ALTERNATIVE_ADDED',
      'FILE_UPLOADED',
    ],
  },
  {
    category: 'Administration',
    actions: [
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_ROLE_CHANGED',
    ],
  },
];

export const COMMON_ENTITY_TYPES = [
  'Decision',
  'User',
  'Alternative',
  'Discussion',
  'FileAttachment',
];

interface AuditFiltersProps {
  users: User[];
  search: string;
  action: string;
  userId: string;
  entityType: string;
  startDate: string;
  endDate: string;
  sortOrder: 'desc' | 'asc';
  onSearchChange: (val: string) => void;
  onActionChange: (val: string) => void;
  onUserChange: (val: string) => void;
  onEntityTypeChange: (val: string) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onSortOrderChange: (val: 'desc' | 'asc') => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AuditFilters: React.FC<AuditFiltersProps> = ({
  users,
  search,
  action,
  userId,
  entityType,
  startDate,
  endDate,
  sortOrder,
  onSearchChange,
  onActionChange,
  onUserChange,
  onEntityTypeChange,
  onStartDateChange,
  onEndDateChange,
  onSortOrderChange,
  onReset,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="glass-card p-4 sm:p-6 flex flex-col gap-4 bg-surface-elevated/40 border border-border/80 rounded-xl w-full min-w-0"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full min-w-0">
        {/* Search */}
        <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-3 lg:col-span-2 min-w-0">
          <Input
            label="Search"
            placeholder="Search by keywords in description, endpoint, or IP..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* User Filter */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
            User
          </label>
          <select
            value={userId}
            onChange={(e) => onUserChange(e.target.value)}
            className="input-field cursor-pointer w-full min-w-0 truncate"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.email})
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
            Action
          </label>
          <select
            value={action}
            onChange={(e) => onActionChange(e.target.value)}
            className="input-field cursor-pointer w-full min-w-0 truncate"
          >
            <option value="">All Actions</option>
            {ACTION_CATEGORIES.map((cat) => (
              <optgroup key={cat.category} label={cat.category}>
                {cat.actions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Entity Type Filter */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
            Entity Type
          </label>
          <select
            value={entityType}
            onChange={(e) => onEntityTypeChange(e.target.value)}
            className="input-field cursor-pointer w-full min-w-0 truncate"
          >
            <option value="">All Entity Types</option>
            {COMMON_ENTITY_TYPES.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="input-field text-text w-full min-w-0"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="input-field text-text w-full min-w-0"
          />
        </div>

        {/* Sort Order */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
            Sorting
          </label>
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'desc' | 'asc')}
            className="input-field cursor-pointer w-full min-w-0 truncate"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-border/40 w-full">
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          className="text-xs text-text-secondary hover:text-text"
        >
          Reset Filters
        </Button>
        <Button type="submit" variant="secondary" className="h-9 px-5 text-sm font-semibold">
          Apply Filters
        </Button>
      </div>
    </form>
  );
};

export default AuditFilters;
