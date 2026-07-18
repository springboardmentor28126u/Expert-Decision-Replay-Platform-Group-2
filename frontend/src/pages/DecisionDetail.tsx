import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { decisionService } from '../services/decisionService';
import type { Decision, DecisionVersion } from '../types/decision';
import {
  IconArrowLeft,
  IconEdit,
  IconSend,
  IconTrash,
  IconHome,
  IconFileText,
  IconMessageCircle,
  IconUser,
  IconCalendar,
  IconStarFilled,
  IconHistory,
  IconListDetails,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/employee' },
  { label: 'My Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Discussions', icon: IconMessageCircle, path: '/dashboard/employee/discussions' },
  { label: 'Profile', icon: IconUser, path: '/dashboard/employee/profile' },
];

const impactColors: Record<string, string> = {
  low: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
};

const riskColors: Record<string, string> = {
  low: 'text-green-600 dark:text-green-400',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-red-600 dark:text-red-400',
};

type Tab = 'overview' | 'alternatives' | 'versions';

export default function DecisionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [versions, setVersions] = useState<DecisionVersion[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  useEffect(() => {
    if (id) fetchDecision();
  }, [id]);

  const fetchDecision = async () => {
    setLoading(true);
    try {
      const data = await decisionService.get(id!);
      setDecision(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load decision');
    }
    setLoading(false);
  };

  const fetchVersions = async () => {
    if (!id) return;
    try {
      const data = await decisionService.getVersions(id);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'versions' && versions.length === 0) {
      fetchVersions();
    }
  }, [activeTab]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to archive this decision?')) return;
    try {
      await decisionService.delete(id);
      navigate('/decisions');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleSubmit = async () => {
    if (!id || !window.confirm('Submit this decision for review? This action will be logged.')) return;
    try {
      const updated = await decisionService.submit(id);
      setDecision(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const isOwner = decision && user && decision.created_by === user.id;
  const isDraft = decision?.status === 'draft';

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !decision) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="text-center py-16">
          <p className="text-red-500">{error || 'Decision not found'}</p>
          <button onClick={() => navigate('/decisions')} className="mt-4 text-indigo-600 hover:underline text-sm">
            Back to Decisions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: IconInfoCircle },
    { key: 'alternatives', label: `Alternatives (${decision.alternatives?.length || 0})`, icon: IconListDetails },
    { key: 'versions', label: 'Version History', icon: IconHistory },
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/decisions')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-0.5"
          >
            <IconArrowLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{decision.title}</h1>
              <StatusBadge status={decision.status} />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${impactColors[decision.impact_level]}`}>
                {decision.impact_level.charAt(0).toUpperCase() + decision.impact_level.slice(1)} Impact
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {decision.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 font-medium text-xs">
                  {decision.category.name}
                </span>
              )}
              <span>by {decision.creator?.full_name || 'Unknown'}</span>
              <span className="inline-flex items-center gap-1">
                <IconCalendar size={14} />
                {formatDate(decision.created_at)}
              </span>
              <span>v{decision.current_version}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && isDraft && (
              <>
                <button
                  onClick={() => navigate(`/decisions/${id}/edit`)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <IconEdit size={16} /> Edit
                </button>
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20"
                >
                  <IconSend size={16} /> Submit
                </button>
              </>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <IconTrash size={16} /> Archive
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Problem Statement
              </h3>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                {decision.problem_statement}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize mt-0.5">
                  {decision.status.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Impact Level</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize mt-0.5">
                  {decision.impact_level}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Target Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                  {decision.target_date || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Alternatives</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                  {decision.alternatives?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div className="space-y-4">
            {(!decision.alternatives || decision.alternatives.length === 0) ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No alternatives added yet.</p>
                {isOwner && isDraft && (
                  <button
                    onClick={() => navigate(`/decisions/${id}/edit`)}
                    className="mt-3 text-sm text-indigo-600 hover:underline"
                  >
                    Edit decision to add alternatives
                  </button>
                )}
              </div>
            ) : (
              decision.alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className={`rounded-2xl border bg-white dark:bg-gray-900/80 p-5 transition-colors ${alt.is_recommended
                      ? 'border-amber-200 dark:border-amber-800/40 ring-1 ring-amber-100 dark:ring-amber-900/20'
                      : 'border-gray-200 dark:border-gray-800/60'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {alt.is_recommended && (
                      <IconStarFilled size={18} className="text-amber-500" />
                    )}
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {alt.title}
                    </h3>
                    {alt.is_recommended && (
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>

                  {alt.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{alt.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Pros */}
                    {alt.pros && alt.pros.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1.5">Pros</p>
                        <ul className="space-y-1">
                          {alt.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-green-500 mt-0.5">+</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Cons */}
                    {alt.cons && alt.cons.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1.5">Cons</p>
                        <ul className="space-y-1">
                          {alt.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-red-500 mt-0.5">−</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {alt.estimated_cost != null && (
                      <span>Cost: <span className="font-medium text-gray-900 dark:text-white">₹{Number(alt.estimated_cost).toLocaleString()}</span></span>
                    )}
                    {alt.feasibility_score != null && (
                      <span>Feasibility: <span className="font-medium text-gray-900 dark:text-white">{alt.feasibility_score}/10</span></span>
                    )}
                    <span>
                      Risk:{' '}
                      <span className={`font-medium capitalize ${riskColors[alt.risk_level]}`}>
                        {alt.risk_level}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-8 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading version history...</p>
              </div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedVersion(expandedVersion === v.version_number ? null : v.version_number)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                        v{v.version_number}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {v.change_summary || `Version ${v.version_number}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          by {v.creator_name || 'Unknown'} · {formatDate(v.created_at)}
                        </p>
                      </div>
                    </div>
                    {expandedVersion === v.version_number ? (
                      <IconChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <IconChevronDown size={18} className="text-gray-400" />
                    )}
                  </button>

                  {expandedVersion === v.version_number && v.snapshot_json && (
                    <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800">
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Title: </span>
                            <span className="text-gray-900 dark:text-white font-medium">{v.snapshot_json.title}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Status: </span>
                            <span className="text-gray-900 dark:text-white font-medium capitalize">
                              {v.snapshot_json.status?.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Category: </span>
                            <span className="text-gray-900 dark:text-white font-medium">{v.snapshot_json.category_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Impact: </span>
                            <span className="text-gray-900 dark:text-white font-medium capitalize">{v.snapshot_json.impact_level}</span>
                          </div>
                        </div>
                        {v.snapshot_json.problem_statement && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Problem Statement</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">{v.snapshot_json.problem_statement}</p>
                          </div>
                        )}
                        {v.snapshot_json.alternatives && v.snapshot_json.alternatives.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                              Alternatives ({v.snapshot_json.alternatives.length})
                            </p>
                            <div className="space-y-2">
                              {v.snapshot_json.alternatives.map((alt: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  {alt.is_recommended && <IconStarFilled size={12} className="text-amber-500" />}
                                  <span className="font-medium text-gray-900 dark:text-white">{alt.title}</span>
                                  <span className="text-gray-400">·</span>
                                  <span className="text-gray-500 capitalize">Risk: {alt.risk_level}</span>
                                  {alt.estimated_cost && (
                                    <span className="text-gray-500">· Cost: ₹{Number(alt.estimated_cost).toLocaleString()}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
