import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ManagerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">
          Management Console
        </h1>
        <p className="mt-1.5 text-sm text-surface-500">
          Welcome back, {user?.name || 'Manager'}. Here is your team overview.
        </p>
      </div>

      {/* Placeholder stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Team Decisions', value: '47', description: 'Total logged by your department', accent: 'border-primary-500' },
          { title: 'Awaiting Approvals', value: '8', description: 'Requires manager approval', accent: 'border-amber-500' },
          { title: 'Approved This Week', value: '14', description: 'Passed audit compliance', accent: 'border-emerald-500' },
          { title: 'Department Replays', value: '18', description: 'Simulated resolution paths', accent: 'border-blue-500' },
        ].map((card) => (
          <div
            key={card.title}
            className={`bg-white rounded-xl border-l-4 ${card.accent} border border-surface-200 p-5 shadow-sm`}
          >
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{card.title}</p>
            <p className="mt-2 text-3xl font-bold text-surface-900">{card.value}</p>
            <p className="mt-1 text-xs text-surface-500">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Workplace template */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Department Decision Approvals</h2>
        <div className="border border-dashed border-surface-200 rounded-lg p-12 text-center text-surface-400">
          <svg className="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm font-medium">All department records are current.</p>
          <p className="text-xs mt-1">Decisions are fully synchronized and approved.</p>
        </div>
      </div>
    </div>
  );
}
