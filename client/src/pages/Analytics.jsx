import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, RefreshCw, Send, CheckCircle, Timer, 
  Database, Globe, ShieldCheck, TrendingUp, GitBranch, 
  PieChart as PieIcon, Package, Clock, AlertTriangle, ExternalLink,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ReferenceLine, PieChart, Pie, 
  Cell, Legend, BarChart, Bar, LabelList
} from 'recharts';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatBytes, formatMs, formatNumber, formatDate } from '../utils/formatters';

const renderDonutCenter = (total) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-2xl font-bold text-primary font-mono">{total}</span>
      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Total</span>
    </div>
  );
};

const Analytics = () => {
  const navigate = useNavigate();
  const [limit, setLimit] = useState(30);

  // Fetch parallelized analytical queries
  const { 
    overview, trend, statusDist, payloadDist, 
    topHosts, methodDist, hourlyActivity, 
    loading, error, refetch 
  } = useAnalytics(limit);

  // Card coloring conditions
  const getSuccessRateColor = (rate) => {
    if (rate >= 80) return 'text-success bg-success/10 border-success/20';
    if (rate >= 60) return 'text-info bg-info/10 border-info/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  const getLatencyColor = (time) => {
    if (time < 500) return 'text-success bg-success/10 border-success/20';
    if (time <= 1000) return 'text-info bg-info/10 border-info/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  const getHttpsColor = (pct) => {
    if (pct >= 90) return 'text-success bg-success/10 border-success/20';
    if (pct >= 70) return 'text-info bg-info/10 border-info/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  const getTopHostLatencyColorClass = (time) => {
    if (time < 500) return 'text-success font-semibold';
    if (time <= 1000) return 'text-info font-semibold';
    return 'text-danger font-semibold';
  };

  // Recharts custom tooltips
  const CustomTrendTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1A1D27] border border-border p-3 rounded-btn shadow-card text-[11px] font-mono leading-relaxed space-y-1">
          <p className="text-primary font-bold">Request #{data.index}</p>
          <p className="text-accent truncate max-w-[200px]" title={data.url}>{data.url}</p>
          <p className="text-[#FCA5A5] font-semibold">Latency: {data.responseTime} ms</p>
          <p className="text-secondary">{formatDate(data.timestamp)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1A1D27] border border-border p-2.5 rounded-btn shadow-card text-xs font-mono">
          <p className="text-primary font-bold">{data.category}</p>
          <p className="text-secondary mt-1">
            Count: <span className="text-primary font-semibold">{data.count}</span> ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1A1D27] border border-border p-2.5 rounded-btn shadow-card text-xs font-mono">
          <p className="text-primary font-bold">{data.method || data.category}</p>
          <p className="text-secondary mt-1">
            Total calls: <span className="text-primary font-semibold">{data.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <BarChart2 className="w-8 h-8 text-accent shrink-0 mt-1" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-primary">Traffic Analytics</h1>
            <p className="text-secondary text-sm mt-1">Visual breakdown of your API traffic patterns.</p>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-panel border border-border p-1 rounded-btn text-xs font-semibold">
            {[
              { label: 'Last 10', val: 10 },
              { label: 'Last 30', val: 30 },
              { label: 'Last 50', val: 50 },
              { label: 'All Time', val: 100 }
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setLimit(opt.val)}
                className={`px-3 py-1.5 rounded-btn transition-colors ${
                  limit === opt.val
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={refetch}
            disabled={loading}
            className="bg-panel border border-border hover:border-accent text-secondary hover:text-primary p-2.5 rounded-btn transition-colors disabled:opacity-40"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/35 rounded-btn flex items-center justify-between gap-3 text-sm text-danger animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Failed to load analytics data. Please try again.</span>
          </div>
          <button
            onClick={refetch}
            className="bg-danger text-white text-xs font-semibold px-3 py-1.5 rounded-btn hover:bg-[#db3b3b] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* SECTION 1: OVERVIEW STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {loading ? (
          // Skeletons Overview Cards
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-panel border border-border h-24 rounded-card animate-pulse" />
          ))
        ) : overview ? (
          <>
            {/* Total Requests */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex flex-col justify-between h-24">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Total Requests</span>
                <Send className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xl font-bold text-primary mt-2 font-mono">{formatNumber(overview.totalRequests)}</span>
            </div>

            {/* Success Rate */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex flex-col justify-between h-24">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Success Rate</span>
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <span className={`text-xl font-bold mt-2 font-mono ${getSuccessRateColor(overview.successRate).split(' ')[0]}`}>
                {overview.successRate}%
              </span>
            </div>

            {/* Average latency */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex flex-col justify-between h-24">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Avg Latency</span>
                <Timer className="w-4 h-4 text-warning" />
              </div>
              <span className={`text-xl font-bold mt-2 font-mono ${getLatencyColor(overview.averageResponseTime).split(' ')[0]}`}>
                {overview.averageResponseTime} ms
              </span>
            </div>

            {/* Data Transferred */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex flex-col justify-between h-24">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Data Transferred</span>
                <Database className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xl font-bold text-primary mt-2 font-mono">{formatBytes(overview.totalDataTransferred)}</span>
            </div>

            {/* Unique Hosts */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex flex-col justify-between h-24">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">Unique Hosts</span>
                <Globe className="w-4 h-4 text-orange" />
              </div>
              <span className="text-xl font-bold text-primary mt-2 font-mono">{overview.uniqueHosts}</span>
            </div>

            {/* HTTPS Coverage */}
            <div className="bg-panel border border-border p-4 rounded-card shadow-card flex flex-col justify-between h-24">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider font-mono">HTTPS Coverage</span>
                <ShieldCheck className="w-4 h-4 text-success" />
              </div>
              <span className={`text-xl font-bold mt-2 font-mono ${getHttpsColor(overview.httpsPercentage).split(' ')[0]}`}>
                {overview.httpsPercentage}%
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* SECTION 2: RESPONSE TIME TREND */}
      <div className="bg-panel border border-border p-5 rounded-card shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4.5 h-4.5 text-accent" />
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-mono">Response Time Trend</h2>
        </div>

        {loading ? (
          <div className="h-[280px] bg-bg/20 rounded-btn animate-pulse flex items-center justify-center">
            <span className="text-xs text-secondary font-mono">Preparing AreaChart...</span>
          </div>
        ) : trend.length < 2 ? (
          <div className="h-[280px] bg-bg/10 rounded-btn border border-border border-dashed flex flex-col items-center justify-center text-center p-4">
            <Timer className="w-12 h-12 text-secondary/30 mb-2" />
            <p className="text-xs text-secondary max-w-xs leading-relaxed">
              Not enough data yet. Send at least 2 requests to see the trend.
            </p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" />
                <XAxis dataKey="index" stroke="#94A3B8" fontSize={10} label={{ value: 'Request #', position: 'insideBottom', offset: -5, fill: '#94A3B8', fontSize: 10 }} />
                <YAxis stroke="#94A3B8" fontSize={10} label={{ value: 'ms', angle: -90, position: 'insideLeft', offset: 10, fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip content={<CustomTrendTooltip />} />
                <ReferenceLine y={1000} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '1s threshold', position: 'top', fill: '#EF4444', fontSize: 9 }} />
                <Area type="monotone" dataKey="responseTime" stroke="#4F8EF7" strokeWidth={2} fillOpacity={1} fill="url(#trendColor)" dot={{ r: 3, stroke: '#4F8EF7', strokeWidth: 1, fill: '#0F1117' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SECTION 3: TWO COLUMN CHARTS (Status Distribution & HTTP Methods) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Status Code Distribution (Donut style) */}
        <div className="bg-panel border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieIcon className="w-4.5 h-4.5 text-accent" />
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-mono">Status Distribution</h2>
          </div>

          {loading ? (
            <div className="h-[280px] bg-bg/20 rounded-btn animate-pulse flex items-center justify-center" />
          ) : statusDist.length === 0 || statusDist.every(s => s.count === 0) ? (
            <div className="h-[280px] flex items-center justify-center text-secondary text-xs italic">
              No status codes logged.
            </div>
          ) : (
            <div className="h-[280px] relative flex flex-col justify-center">
              {/* Abs donut center value */}
              {renderDonutCenter(statusDist.reduce((a, b) => a + b.count, 0))}
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDist.filter(s => s.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {statusDist.filter(s => s.count > 0).map((entry, index) => {
                        const colors = {
                          '2xx Success': '#22C55E',
                          '3xx Redirect': '#4F8EF7',
                          '4xx Client Error': '#F97316',
                          '5xx Server Error': '#EF4444'
                        };
                        return <Cell key={`cell-${index}`} fill={colors[entry.category] || '#94A3B8'} />;
                      })}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legends Row */}
              <div className="flex justify-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-secondary mt-2">
                {[
                  { label: '2xx Success', color: 'bg-success' },
                  { label: '3xx', color: 'bg-accent' },
                  { label: '4xx', color: 'bg-orange' },
                  { label: '5xx', color: 'bg-danger' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-xs ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: HTTP Method Distribution (Vertical bars) */}
        <div className="bg-panel border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <GitBranch className="w-4.5 h-4.5 text-accent" />
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-mono">Request Methods</h2>
          </div>

          {loading ? (
            <div className="h-[280px] bg-bg/20 rounded-btn animate-pulse flex items-center justify-center" />
          ) : methodDist.every(m => m.count === 0) ? (
            <div className="h-[280px] flex items-center justify-center text-secondary text-xs italic">
              No requests recorded.
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodDist} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" vertical={false} />
                  <XAxis dataKey="method" stroke="#94A3B8" fontSize={10} />
                  <YAxis stroke="#94A3B8" fontSize={10} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                    {methodDist.map((entry, index) => {
                      const colors = {
                        GET: '#4F8EF7',
                        POST: '#22C55E',
                        PUT: '#F97316',
                        PATCH: '#A78BFA',
                        DELETE: '#EF4444'
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry.method] || '#94A3B8'} />;
                    })}
                    <LabelList dataKey="count" position="top" fill="#E2E8F0" fontSize={10} offset={6} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* SECTION 4: TWO COLUMN CHARTS (Payload & Hourly Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Payload Size Distribution (Horizontal bars) */}
        <div className="bg-panel border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <Package className="w-4.5 h-4.5 text-accent" />
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-mono">Payload Distribution</h2>
          </div>

          {loading ? (
            <div className="h-[220px] bg-bg/20 rounded-btn animate-pulse flex items-center justify-center" />
          ) : payloadDist.every(p => p.count === 0) ? (
            <div className="h-[220px] flex items-center justify-center text-secondary text-xs italic">
              No payload data.
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payloadDist} layout="vertical" margin={{ top: 10, right: 30, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} />
                  <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={9} width={80} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                    {payloadDist.map((entry, index) => {
                      let fill = '#4F8EF7';
                      if (entry.category.includes('Medium')) fill = '#EAB308';
                      if (entry.category.includes('Large')) fill = '#EF4444';
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                    <LabelList dataKey="percentage" position="right" fill="#E2E8F0" fontSize={9} formatter={(v) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Hourly Activity Heatmap */}
        <div className="bg-panel border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <Clock className="w-4.5 h-4.5 text-accent" />
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-mono">Hourly Activity</h2>
          </div>

          {loading ? (
            <div className="h-[220px] bg-bg/20 rounded-btn animate-pulse flex items-center justify-center" />
          ) : hourlyActivity.every(a => a.count === 0) ? (
            <div className="h-[220px] flex items-center justify-center text-secondary text-xs italic">
              No daily hourly activity.
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94A3B8" fontSize={9} formatter={(h) => h % 6 === 0 ? `${h}h` : ''} />
                  <YAxis stroke="#94A3B8" fontSize={9} />
                  <Tooltip formatter={(value, name, props) => [`${value} requests`, `Hour: ${props.payload.hour}h`]} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {hourlyActivity.map((entry, index) => {
                      let fill = '#4F8EF7';
                      if (entry.count === 0) fill = '#2A2D3E';
                      else if (entry.count < 3) fill = '#1D3461';
                      else if (entry.count < 8) fill = '#2952A3';
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* SECTION 5: TOP HOSTS TABLE */}
      <div className="bg-panel border border-border rounded-card shadow-card overflow-hidden">
        <div className="bg-[#131620] border-b border-border p-4 flex items-center gap-2">
          <Globe className="w-4.5 h-4.5 text-accent animate-pulse" />
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-mono">Top API Hosts</h2>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : topHosts.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center p-4">
            <Globe className="w-12 h-12 text-secondary/35 mb-2" />
            <span className="text-xs text-secondary italic">No host data available yet.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead className="bg-bg/40 font-semibold text-[10px] text-secondary uppercase tracking-wider">
                <tr className="border-b border-border">
                  <th className="p-3.5 w-12">#</th>
                  <th className="p-3.5">Host</th>
                  <th className="p-3.5">Total Requests</th>
                  <th className="p-3.5">Avg Response Time</th>
                  <th className="p-3.5">Success Rate</th>
                  <th className="p-3.5 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 font-medium">
                {topHosts.map((row, idx) => {
                  // Percentage bar calculation (relative to rank 1 count)
                  const maxCount = topHosts[0]?.count || 1;
                  const ratio = (row.count / maxCount) * 100;

                  return (
                    <tr key={row.host} className="bg-bg/15 hover:bg-[#1F2235] transition-colors">
                      {/* Rank */}
                      <td className="p-3.5 font-mono text-secondary">{idx + 1}</td>

                      {/* Host */}
                      <td className="p-3.5 font-mono font-bold text-accent">{row.host}</td>

                      {/* Count with progress indicator */}
                      <td className="p-3.5 max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-primary font-mono">{row.count}</span>
                          <div className="flex-1 bg-[#1A1D27] h-1.5 rounded-full overflow-hidden border border-border hidden sm:block">
                            <div 
                              className="bg-accent h-full rounded-full"
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Avg Response Time */}
                      <td className={`p-3.5 font-mono ${getTopHostLatencyColorClass(row.avgResponseTime)}`}>
                        {row.avgResponseTime} ms
                      </td>

                      {/* Success Rate */}
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          row.successRate >= 80 
                            ? 'bg-success/5 text-success border-success/20' 
                            : row.successRate >= 60 
                              ? 'bg-info/5 text-info border-info/20' 
                              : 'bg-danger/5 text-danger border-danger/20'
                        }`}>
                          {row.successRate}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right shrink-0">
                        <button
                          onClick={() => {
                            navigate(`/history?host=${row.host}`);
                            toast.success(`Navigating to history filtered by ${row.host}`);
                          }}
                          className="bg-bg border border-border hover:border-accent text-secondary hover:text-accent p-1.5 rounded-btn transition-colors"
                          title={`View requests for ${row.host}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Analytics;
