import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">
          System Administration
        </h1>
        <p className="mt-1.5 text-sm text-surface-500">
          Administrator panel for system configurations, telemetry, and platform auditing.
        </p>
      </div>

      {/* Placeholder stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Registered Users', value: '142', description: 'Across all enterprise departments', accent: 'border-primary-500' },
          { title: 'Platform Replays Run', value: '1,208', description: 'Cumulative decision simulations', accent: 'border-purple-500' },
          { title: 'System Storage', value: '94.2%', description: 'Database and log file capacity', accent: 'border-red-500' },
          { title: 'Active Services', value: '100%', description: 'All node endpoints running healthy', accent: 'border-emerald-500' },
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
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Platform Audit Logs</h2>
        <div className="border border-dashed border-surface-200 rounded-lg p-12 text-center text-surface-400">
          <svg className="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium">No recent system anomalies reported.</p>
          <p className="text-xs mt-1">Logging server active. Health heartbeats: Stable.</p>
        </div>
      </div>
    </div>
  );
}
