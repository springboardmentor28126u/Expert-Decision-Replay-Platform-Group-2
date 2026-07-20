import React from 'react';
import { Alternative } from '../../types';

interface ComparisonChartProps {
  alternatives: Alternative[];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ alternatives }) => {
  if (alternatives.length === 0) return null;

  // Function to calculate net score: (Quality + Feasibility) - (Cost + Risk)
  // Higher Quality & Feasibility are good (+)
  // Higher Cost & Risk are bad (-)
  const getNetScore = (alt: Alternative) => {
    const quality = alt.quality || 0;
    const feasibility = alt.feasibility || 0;
    const cost = alt.cost || 0;
    const risk = alt.risk || 0;
    return quality + feasibility - (cost + risk);
  };

  const maxScore = 20; // Max quality + feasibility = 20
  const minScore = -20; // Max cost + risk = 20

  return (
    <div className="glass-card p-6 border border-border/80">
      <h3 className="text-base font-bold text-text mb-4">Alternatives Evaluation Matrix</h3>
      <div className="space-y-6">
        {alternatives.map((alt) => {
          const netScore = getNetScore(alt);
          // Map score from [-20, 20] to [0%, 100%]
          const scorePercent = ((netScore - minScore) / (maxScore - minScore)) * 100;
          
          let colorClass = 'bg-primary';
          if (netScore > 3) colorClass = 'bg-success';
          else if (netScore < -3) colorClass = 'bg-error';
          else if (netScore !== 0) colorClass = 'bg-warning';

          return (
            <div key={alt.id} className="space-y-1.5 animate-fadeIn">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-text">{alt.name}</span>
                <span className="text-xs text-text-secondary">
                  Score: <strong className="text-text">{netScore > 0 ? `+${netScore}` : netScore}</strong>
                </span>
              </div>
              
              <div className="w-full bg-surface rounded-full h-3 border border-border/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              
              {/* Detailed Breakdown Micro bar */}
              <div className="grid grid-cols-4 gap-2 text-[10px] text-text-muted text-center pt-0.5">
                <div>
                  Quality: <span className="font-semibold text-success">{alt.quality}/10</span>
                </div>
                <div>
                  Feasibility: <span className="font-semibold text-info">{alt.feasibility}/10</span>
                </div>
                <div>
                  Cost: <span className="font-semibold text-warning">{alt.cost}/10</span>
                </div>
                <div>
                  Risk: <span className="font-semibold text-error">{alt.risk}/10</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 border-t border-border/40 pt-3 text-[11px] text-text-muted text-center">
        Note: Net Score = (Quality + Feasibility) - (Cost + Risk). Higher scores represent better trade-offs.
      </div>
    </div>
  );
};

export default ComparisonChart;
