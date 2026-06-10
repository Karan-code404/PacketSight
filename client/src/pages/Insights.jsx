import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getGlobalInsights } from '../services/api';

const Insights = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGlobalInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getGlobalInsights();
      setIssues(res.data.issues || []);
    } catch (err) {
      setError('Failed to fetch system-wide insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalInsights();
  }, []);

  const handleRefresh = () => {
    fetchGlobalInsights();
    toast.success('Smart Insights updated.');
  };

  const getImpactBadgeColor = () => {
    return 'bg-bg text-primary border border-border';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-primary">Smart Insights</h1>
            <p className="text-secondary text-sm mt-1">Automated recommendations based on your historical API traffic.</p>
          </div>
        </div>
        <div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-full sm:w-auto bg-panel border border-border hover:border-accent text-secondary hover:text-primary text-xs font-semibold px-4 py-2.5 rounded-btn flex items-center justify-center gap-1.5 transition-colors font-mono"
          >
            [Analyze Traffic]
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/35 rounded-btn flex items-center justify-between gap-3 text-sm text-danger animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span>[Error] {error}</span>
          </div>
          <button
            onClick={fetchGlobalInsights}
            className="bg-danger text-white text-xs font-semibold px-3 py-1.5 rounded-btn hover:bg-[#db3b3b] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Top System-Wide Issues</h2>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-panel border border-border h-[120px] rounded-btn animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && issues.length === 0 && (
          <div className="bg-panel border border-border border-dashed p-16 rounded-card flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold text-primary">System is fully optimized</h3>
            <p className="text-secondary text-sm max-w-sm mt-1">
              All tested APIs are running with excellent latencies and secure headers! No actions required.
            </p>
          </div>
        )}

        {!loading && !error && issues.length > 0 && (
          <div className="space-y-4 font-medium">
            {issues.map((issue, idx) => {
              let borderClass, label;
              if (issue.type === 'critical') {
                borderClass = 'border-l-4 border-danger';
                label = '[CRITICAL]';
              } else {
                borderClass = 'border-l-4 border-warning';
                label = '[WARNING]';
              }

              return (
                <div 
                  key={idx} 
                  className={`flex gap-4 p-4 border border-border rounded-btn shadow-sm ${borderClass} bg-panel`}
                >
                  <div className="mt-0.5 shrink-0 text-xs font-mono font-bold select-none">{label}</div>
                  
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-bg border border-border text-secondary text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                        [{issue.category}]
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getImpactBadgeColor(issue.impact)}`}>
                        Impact: {issue.impact}
                      </span>
                    </div>

                    <p className="text-primary text-sm font-semibold leading-relaxed">
                      <span className="font-mono text-primary font-bold">{issue.count}</span> {issue.message}
                    </p>

                    <div className="bg-bg/40 border border-border/60 rounded-btn p-3 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-primary font-semibold uppercase tracking-wider text-[9px] font-mono">
                        Recommended Action
                      </div>
                      <p className="text-secondary leading-relaxed mt-1">
                        {issue.action}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
