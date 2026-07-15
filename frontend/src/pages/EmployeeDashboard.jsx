import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">
          Welcome back, {user?.name || 'Employee'}
        </h1>
        <p className="mt-1.5 text-sm text-surface-500">
          Here is an overview of your recorded decisions and active replays.
        </p>
      </div>

      {/* Placeholder stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'My Logged Decisions', value: '12', description: 'Decisions recorded this month', accent: 'border-primary-500' },
          { title: 'Active Replays', value: '3', description: 'Replay simulations in progress', accent: 'border-emerald-500' },
          { title: 'Under Review', value: '4', description: 'Awaiting reviewer feedback', accent: 'border-amber-500' },
          { title: 'Approved Decisions', value: '8', description: 'Successfully resolved decisions', accent: 'border-blue-500' },
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

      {/* Main workplace template space */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">My Decision Log</h2>
        <div className="border border-dashed border-surface-200 rounded-lg p-12 text-center text-surface-400">
          <svg className="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium">No active recordings in this session.</p>
          <p className="text-xs mt-1">Start recording a decision to compile execution history.</p>
        </div>
      </div>
    </div>
  );
}
