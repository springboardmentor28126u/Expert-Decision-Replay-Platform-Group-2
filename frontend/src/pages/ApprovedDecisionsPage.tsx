import React, { useState, useEffect } from 'react';
import { decisionsApi } from '../api/decisions';
import { DecisionListResponse } from '../types';
import DecisionCard from '../components/decisions/DecisionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ApprovedDecisionsPage: React.FC = () => {
  const [data, setData] = useState<DecisionListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApproved = async () => {
      setLoading(true);
      try {
        const res = await decisionsApi.list({ status: 'Approved' });
        setData(res);
      } catch (err) {
        console.error('Failed to fetch approved decisions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApproved();
  }, []);

  return (
    <div className="section-spacing">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text">Approved Decisions</h1>
        <p className="text-sm text-text-secondary mt-1">
          Archived repository of verified and finalized organizational decisions.
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
          No approved decisions found.
        </div>
      )}
    </div>
  );
};

export default ApprovedDecisionsPage;
