import React from 'react';
import Card from '../common/Card';
import { Alternative } from '../../types';

interface AlternativeListProps {
  alternatives: Alternative[];
  onEdit: (alt: Alternative) => void;
  onDelete: (altId: number) => void;
  canEdit: boolean;
}

const AlternativeList: React.FC<AlternativeListProps> = ({
  alternatives,
  onEdit,
  onDelete,
  canEdit,
}) => {
  if (alternatives.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-text-secondary">
        No alternatives analyzed yet. Add some options to compare.
      </div>
    );
  }

  const renderMetric = (label: string, value: number | null, color: string) => {
    return (
      <div className="flex items-center justify-between text-xs border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
        <span className="text-text-muted">{label}</span>
        <span className={`font-bold ${color}`}>{value !== null ? `${value}/10` : 'N/A'}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {alternatives.map((alt) => (
        <Card key={alt.id} className="flex flex-col justify-between border-t-2 border-t-primary/30">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-base font-bold text-text">{alt.name}</h4>
              {canEdit && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onEdit(alt)}
                    className="rounded p-1 text-text-secondary hover:bg-surface-hover hover:text-text transition-all"
                    title="Edit Alternative"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(alt.id)}
                    className="rounded p-1 text-error/70 hover:bg-error/10 hover:text-error transition-all"
                    title="Delete Alternative"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 bg-surface-elevated/40 rounded-lg p-3 border border-border/40">
              <div className="space-y-1.5">
                {renderMetric('Quality', alt.quality, 'text-success')}
                {renderMetric('Feasibility', alt.feasibility, 'text-info')}
              </div>
              <div className="space-y-1.5">
                {renderMetric('Cost', alt.cost, 'text-warning')}
                {renderMetric('Risk', alt.risk, 'text-error')}
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {alt.pros && (
                <div>
                  <span className="text-[10px] font-bold text-success uppercase tracking-wider block mb-1">
                    Pros
                  </span>
                  <div className="text-xs text-text-secondary bg-success-bg/20 rounded px-2.5 py-1.5 border border-success/10 whitespace-pre-line">
                    {alt.pros}
                  </div>
                </div>
              )}

              {alt.cons && (
                <div>
                  <span className="text-[10px] font-bold text-error uppercase tracking-wider block mb-1">
                    Cons
                  </span>
                  <div className="text-xs text-text-secondary bg-error-bg/20 rounded px-2.5 py-1.5 border border-error/10 whitespace-pre-line">
                    {alt.cons}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AlternativeList;
