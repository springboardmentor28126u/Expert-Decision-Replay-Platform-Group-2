import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { decisionService } from '../services/decisionService';
import { categoryService } from '../services/categoryService';
import type { DecisionListItem, DecisionCategory } from '../types/decision';
import {
  IconPlus,
  IconSearch,
  IconChevronRight,
  IconFileText,
  IconHome,
  IconMessageCircle,
  IconUser,
  IconCalendar,
  IconChevronLeft,
  IconUsers,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/employee' },
  { label: 'My Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Groups', icon: IconUsers, path: '/dashboard/employee/groups' },
  { label: 'Discussions', icon: IconMessageCircle, path: '/dashboard/employee/discussions' },
  { label: 'Profile', icon: IconUser, path: '/profile' },
];

const impactColors: Record<string, string> = {
  low: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
};

export default function DecisionList() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<DecisionListItem[]>([]);
  const [categories, setCategories] = useState<DecisionCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [myOnly, setMyOnly] = useState(true);
  const limit = 10;

  useEffect(() => {
    categoryService.list().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [page, statusFilter, categoryFilter, myOnly]);

  const fetchDecisions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await decisionService.list({
        skip: (page - 1) * limit,
        limit,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        search: search || undefined,
        my_only: myOnly,
      });
      setDecisions(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load decisions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDecisions();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setMyOnly(true);
    setPage(1);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const hasActiveFilters = search || statusFilter || categoryFilter || !myOnly;

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Decisions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {total} decision{total !== 1 ? 's' : ''} found
            </p>
          </div>
          <button
            id="create-decision-btn"
            onClick={() => navigate('/decisions/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20"
          >
            <IconPlus size={18} stroke={2} />
            <span>Create Decision</span>
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="decision-search"
                  type="text"
                  placeholder="Search decisions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </form>

            {/* Status Filter */}
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>

            {/* Category Filter */}
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* My Only toggle */}
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={myOnly}
                onChange={(e) => { setMyOnly(e.target.checked); setPage(1); }}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-700 dark:text-gray-300">My decisions only</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        {/* Decision List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : decisions.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <IconFileText size={28} stroke={1.5} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {hasActiveFilters ? 'No results match your filters' : 'No decisions found'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Create your first decision to get started.'}
                  </p>
                </div>
                {hasActiveFilters ? (
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Clear all filters
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/decisions/new')}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <IconPlus size={16} />
                    Create Decision
                  </button>
                )}
              </div>
            </div>
          ) : (
            decisions.map((decision) => (
              <button
                key={decision.id}
                onClick={() => navigate(`/decisions/${decision.id}`)}
                className="w-full text-left rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-5 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {decision.title}
                      </h3>
                      <StatusBadge status={decision.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {decision.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 font-medium">
                          {decision.category.name}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${impactColors[decision.impact_level] || impactColors.medium}`}>
                        {decision.impact_level.charAt(0).toUpperCase() + decision.impact_level.slice(1)} Impact
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <IconCalendar size={13} />
                        {formatDate(decision.created_at)}
                      </span>
                      {decision.alternative_count > 0 && (
                        <span>{decision.alternative_count} alternative{decision.alternative_count !== 1 ? 's' : ''}</span>
                      )}
                      <span>v{decision.current_version}</span>
                    </div>
                  </div>
                  <IconChevronRight
                    size={20}
                    className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1"
                  />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {pages} · {total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <IconChevronLeft size={16} /> Prev
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <IconChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
