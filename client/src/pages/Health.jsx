import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { toast } from 'sonner';
import { useHealth } from '../hooks/useHealth';
import { getHostUptime } from '../services/api';
import { timeAgo } from '../utils/timeAgo';
import { formatMs } from '../utils/formatters';
import RequestDetailDrawer from '../components/RequestDetailDrawer';

// Inner component for async loading of sparkline & uptime details per card
const HostHealthCard = ({ host }) => {
  const navigate = useNavigate();
  const [uptimeData, setUptimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUptime = async () => {
      try {
        const res = await getHostUptime(host.host);
        setUptimeData(res.data);
      } catch (err) {
        console.error(`Failed to fetch uptime for ${host.host}`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchUptime();
  }, [host.host]);

  // Color mapping based on health status (simplified to white border class)
  const statusClass = 'bg-bg text-primary border-border';
  const dotClass = 'bg-secondary';
  
  const getProgressBgClass = (status) => {
    if (status === 'healthy') return 'bg-success';
    if (status === 'warning') return 'bg-warning';
    return 'bg-danger';
  };
  const progressBgClass = getProgressBgClass(host.healthStatus);

  return (
    <div className="bg-panel border border-border rounded-card p-4 shadow-card flex flex-col justify-between gap-4">
      
      {/* Card Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass}`} />
          <span className="font-mono text-xs font-semibold text-primary truncate max-w-[150px]" title={host.host}>
            {host.host}
          </span>
        </div>

        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusClass}`}>
          {host.healthStatus}
        </span>
      </div>

      <div className="text-[10px] text-secondary font-mono italic">
        Last checked: {timeAgo(host.lastChecked)}
      </div>

      {/* Stats Divider */}
      <div className="grid grid-cols-3 gap-2 border-y border-border/40 py-2.5 text-center text-xs">
        <div>
          <span className="block text-[8px] text-secondary font-bold uppercase tracking-wider">Availability</span>
          <span className="font-semibold text-primary font-mono mt-0.5 block">{host.availability}%</span>
        </div>
        <div>
          <span className="block text-[8px] text-secondary font-bold uppercase tracking-wider">Avg Speed</span>
          <span className="font-semibold text-primary font-mono mt-0.5 block">{formatMs(host.avgResponseTime)}</span>
        </div>
        <div>
          <span className="block text-[8px] text-secondary font-bold uppercase tracking-wider">Last Status</span>
          <span className="font-semibold font-mono mt-0.5 inline-block text-[10px] px-1 rounded text-primary">
            {host.lastStatus || '—'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] font-mono text-secondary">
          <span>Uptime Rating</span>
          <span>{host.availability}%</span>
        </div>
        <div className="w-full bg-[#1A1D27] h-2 rounded-full overflow-hidden border border-border relative">
          <div 
            className={`h-full rounded-full ${progressBgClass} transition-all duration-300`}
            style={{ width: `${host.availability}%` }}
          />
        </div>
      </div>

      {/* 7-Day Sparkline */}
      <div className="space-y-1">
        <span className="block text-[8px] text-secondary font-bold uppercase tracking-wider font-mono">7-Day Traffic Sparkline</span>
        <div className="h-12 border border-border bg-[#0F1117]/30 rounded-btn p-1.5 flex items-center justify-center">
          {loading ? (
            <span className="text-[10px] text-secondary font-mono animate-pulse">[Loading...]</span>
          ) : uptimeData && uptimeData.last7Days ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uptimeData.last7Days} barGap={2}>
                <Bar dataKey="total">
                  {uptimeData.last7Days.map((day, idx) => {
                    let fill = '#2A2D3E'; // No Traffic
                    if (day.total > 0) {
                      fill = day.failed > 0 ? '#EF4444' : '#22C55E';
                    }
                    return <Cell key={`cell-${idx}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <span className="text-[10px] text-secondary/50 italic">No sparkline logs</span>
          )}
        </div>
      </div>

      {/* Recent Errors */}
      <div className="space-y-1 flex-1 flex flex-col justify-end">
        <span className="block text-[8px] text-secondary font-bold uppercase tracking-wider font-mono">Recent Errors</span>
        {host.recentErrors && host.recentErrors.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {host.recentErrors.map((err, idx) => (
              <span key={idx} className="bg-bg text-primary text-[9px] border border-border px-1.5 py-0.5 rounded-btn font-mono" title={new Date(err.timestamp).toLocaleString()}>
                {err.status}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-primary font-semibold font-mono block">No errors recorded</span>
        )}
      </div>

      {/* View History Button */}
      <div className="pt-2 border-t border-border/40 flex justify-end shrink-0">
        <button
          onClick={() => navigate(`/history?host=${host.host}`)}
          className="text-[10px] font-bold text-accent hover:text-accent-hover transition-colors font-mono"
        >
          View History →
        </button>
      </div>

    </div>
  );
};

const Health = () => {
  const navigate = useNavigate();

  // Fetch health summary and failures in parallel
  const { hosts, failures, loading, error, refetch } = useHealth();

  // Selected history inspect state
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Compute status metrics
  const healthyCount = hosts.filter(h => h.healthStatus === 'healthy').length;
  const needAttentionCount = hosts.filter(h => h.healthStatus === 'warning' || h.healthStatus === 'critical').length;

  const handleManualRefresh = () => {
    refetch();
    toast.success('API Health metrics updated.');
  };

  const getMethodBadgeColorClass = () => {
    return 'bg-bg text-primary border border-border';
  };

  const getStatusColorClass = () => {
    return 'text-primary bg-bg border-border';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-primary">API Health Monitor</h1>
            <p className="text-secondary text-sm mt-1">Track the stability and availability of your monitored APIs.</p>
          </div>
        </div>
        <div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="w-full sm:w-auto bg-panel border border-border hover:border-accent text-secondary hover:text-primary text-xs font-semibold px-4 py-2.5 rounded-btn flex items-center justify-center gap-1.5 transition-colors font-mono"
          >
            [Refresh]
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/35 rounded-btn flex items-center justify-between gap-3 text-sm text-danger animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span>[Error] Failed to load health metrics. Please try again.</span>
          </div>
          <button
            onClick={refetch}
            className="bg-danger text-white text-xs font-semibold px-3 py-1.5 rounded-btn hover:bg-[#db3b3b] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* SECTION 1: HEALTH OVERVIEW ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-panel border border-border h-24 rounded-card animate-pulse" />
          ))
        ) : (
          <>
            {/* Monitored APIs */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex items-center justify-between h-24">
              <div>
                <span className="block text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Monitored APIs</span>
                <span className="text-2xl font-bold text-primary block mt-1 font-mono">{hosts.length}</span>
              </div>
            </div>

            {/* Healthy APIs */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex items-center justify-between h-24">
              <div>
                <span className="block text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Healthy APIs</span>
                <span className="text-2xl font-bold text-primary block mt-1 font-mono">{healthyCount}</span>
              </div>
            </div>

            {/* APIs Needing Attention */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex items-center justify-between h-24">
              <div>
                <span className="block text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Attention Required</span>
                <span className="text-2xl font-bold block mt-1 font-mono text-primary">
                  {needAttentionCount}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* SECTION 2: PER-HOST HEALTH CARDS GRID */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Monitored Hosts Health</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-panel border border-border h-[280px] rounded-card animate-pulse" />
            ))}
          </div>
        ) : hosts.length === 0 ? (
          <div className="bg-panel border border-border border-dashed p-16 rounded-card flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold text-primary">No APIs monitored yet</h3>
            <p className="text-secondary text-sm max-w-sm mt-1">
              Start sending requests from the Request Analyzer to populate health logs and stability charts.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2.5 rounded-btn mt-4 shadow-sm transition-colors"
            >
              Go to Request Analyzer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hosts.map((host) => (
              <HostHealthCard 
                key={host.host} 
                host={host} 
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: RECENT FAILURES FEED */}
      <div className="bg-panel border border-border rounded-card shadow-card overflow-hidden">
        <div className="bg-[#131620] border-b border-border p-4 flex items-center gap-2">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-mono">Recent Failures</h2>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <span className="text-xs text-secondary font-mono animate-pulse">[Loading...]</span>
          </div>
        ) : failures.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <span className="text-xs text-primary font-semibold font-mono">No failures recorded. Your APIs are running smoothly.</span>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {failures.map((f) => (
              <div
                key={f._id}
                onClick={() => {
                  setSelectedRequestId(f._id);
                  setIsDrawerOpen(true);
                }}
                className="flex items-center justify-between p-3.5 hover:bg-[#1F2235] cursor-pointer transition-colors text-xs font-semibold"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${getMethodBadgeColorClass(f.method)}`}>
                    {f.method}
                  </span>
                  <span className="font-mono text-primary truncate max-w-[250px] sm:max-w-md font-medium" title={f.url}>
                    {f.url}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getStatusColorClass(f.status)}`}>
                    {f.status || 'ERR'}
                  </span>
                  <span className="text-secondary text-[11px] text-right min-w-[70px]">
                    {timeAgo(f.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details drawer reuse */}
      <RequestDetailDrawer
        requestId={selectedRequestId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRequestId(null);
        }}
      />
    </div>
  );
};

export default Health;
