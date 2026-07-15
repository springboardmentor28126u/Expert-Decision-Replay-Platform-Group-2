import { Link } from 'react-router-dom';

/**
 * HomePage — Dashboard landing page.
 * This is a placeholder that will be replaced with actual dashboard content.
 */
function HomePage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="mt-1 text-surface-500">
          Welcome to the Expert Decision Replay Platform.
        </p>
      </div>

      {/* Placeholder cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Total Decisions', value: '—', accent: 'from-primary-500 to-primary-600' },
          { title: 'Active Replays', value: '—', accent: 'from-emerald-500 to-emerald-600' },
          { title: 'Pending Reviews', value: '—', accent: 'from-amber-500 to-amber-600' },
        ].map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${card.accent}`}>
              {card.title}
            </div>
            <p className="mt-4 text-3xl font-bold text-surface-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-dashed border-surface-300 p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-900">No decisions yet</h3>
        <p className="mt-1 text-sm text-surface-500">
          Create your first decision replay to get started.
        </p>
      </div>
    </div>
  );
}

export default HomePage;
