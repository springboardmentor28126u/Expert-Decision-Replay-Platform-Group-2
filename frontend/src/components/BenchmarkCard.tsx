import { useState, useEffect } from 'react';
import { IconChartBar, IconAlertTriangle, IconCheck, IconMinus } from '@tabler/icons-react';
import { benchmarkService, BenchmarkResult } from '../services/benchmarkService';

interface BenchmarkCardProps {
  companyId: string;
  categoryId: string;
  financialImpact?: number | null;
}

export function BenchmarkCard({ companyId, categoryId, financialImpact }: BenchmarkCardProps) {
  const [data, setData] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    benchmarkService
      .getBenchmark(companyId, categoryId, financialImpact ?? undefined)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [companyId, categoryId, financialImpact]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-5">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
          <IconChartBar size={16} className="animate-pulse" />
          Loading benchmark...
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (data.insufficient_data) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-5">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
          <IconChartBar size={16} />
          <span className="font-medium">Benchmark</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Not enough historical data ({data.similar_decision_count}/3 similar decisions).
        </p>
      </div>
    );
  }

  const deltaColor =
    data.delta_pct !== null
      ? data.delta_pct > 0
        ? 'text-red-600 dark:text-red-400'
        : data.delta_pct < 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-gray-500 dark:text-gray-400'
      : '';

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <IconChartBar size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          Category Benchmark
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {data.similar_decision_count} similar decisions
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Cost</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            ${data.avg_cost?.toLocaleString() ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Approval Time</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.avg_approval_days?.toFixed(1) ?? '—'} days
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Alternatives</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.avg_alternatives?.toFixed(1) ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rejection Rate</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.rejection_rate?.toFixed(1) ?? '—'}%
          </p>
        </div>
      </div>

      {data.delta_pct !== null && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          {data.delta_pct > 0 ? (
            <IconAlertTriangle size={14} className="text-red-500" />
          ) : data.delta_pct < 0 ? (
            <IconCheck size={14} className="text-green-500" />
          ) : (
            <IconMinus size={14} className="text-gray-400" />
          )}
          <span className={`text-xs font-medium ${deltaColor}`}>
            {data.delta_pct > 0 ? '+' : ''}{data.delta_pct}% vs category average
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            (you: ${data.current_cost?.toLocaleString() ?? '—'})
          </span>
        </div>
      )}
    </div>
  );
}
