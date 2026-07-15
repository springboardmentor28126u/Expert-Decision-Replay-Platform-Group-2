import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ReviewerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">
          Review Console
        </h1>
        <p className="mt-1.5 text-sm text-surface-500">
          Welcome, {user?.name || 'Reviewer'}. You have decisions awaiting review.
        </p>
      </div>

      {/* Placeholder stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Awaiting My Review', value: '5', description: 'Pending analysis approval', accent: 'border-amber-500' },
          { title: 'Reviewed Decisions', value: '28', description: 'Total reviews completed', accent: 'border-emerald-500' },
          { title: 'Replays Inspected', value: '42', description: 'Simulation runs checked', accent: 'border-primary-500' },
          { title: 'Discrepancies Flagged', value: '2', description: 'Decisions sent back to review', accent: 'border-red-500' },
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
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Pending Review Queue</h2>
        <div className="border border-dashed border-surface-200 rounded-lg p-12 text-center text-surface-400">
          <svg className="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="text-sm font-medium">Your review queue is currently empty.</p>
          <p className="text-xs mt-1">Excellent work! Check back later for new records.</p>
        </div>
      </div>
    </div>
  );
}
