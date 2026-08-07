import React from 'react';
import Card from '../components/common/Card';

const NotificationsPage: React.FC = () => {
  return (
    <div className="section-spacing">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text">Notifications</h1>
        <p className="text-sm text-text-secondary mt-1">
          Stay updated on decision reviews, discussion comments, and status updates.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-4 flex items-start gap-4">
          <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-text">Welcome to Expert Decision Replay Platform</h4>
            <p className="text-xs text-text-secondary mt-1">
              Your system notifications and decision activity alerts will be surfaced here.
            </p>
            <span className="text-[11px] text-text-muted mt-2 block">Just now</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;
