import React from 'react';
import Card from '../components/common/Card';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="section-spacing">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text">Decision Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">
          Metrics and insights into institutional decision workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm font-medium text-text-secondary">Total Decisions</div>
          <div className="text-3xl font-extrabold text-text mt-2">--</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-text-secondary">Approval Rate</div>
          <div className="text-3xl font-extrabold text-primary mt-2">100%</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-text-secondary">Average Review Time</div>
          <div className="text-3xl font-extrabold text-accent mt-2">1.5 days</div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
