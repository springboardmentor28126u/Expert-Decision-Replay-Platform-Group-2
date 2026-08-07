import React, { useState, useEffect } from 'react';
import { decisionsApi } from '../api/decisions';
import { DecisionListResponse } from '../types';
import DecisionCard from '../components/decisions/DecisionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PendingApprovalsPage: React.FC = () => {
  const [data, setData] = useState<DecisionListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const res = await decisionsApi.list({ status: 'Under Review' });
        setData(res);
      } catch (err) {
        console.error('Failed to fetch pending approvals', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  return (
    <div className="section-spacing">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text">Pending Approvals</h1>
        <p className="text-sm text-text-secondary mt-1">
          Decisions currently under formal review requiring authorization.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((d) => (
            <DecisionCard key={d.id} decision={d} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-text-secondary">
          No decisions currently pending review.
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsPage;
