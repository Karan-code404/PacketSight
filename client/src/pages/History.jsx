import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import useHistory from '../hooks/useHistory';
import { deleteRequest, clearAllHistory } from '../services/api';
import { timeAgo } from '../utils/timeAgo';
import { formatBytes } from '../utils/formatters';
import RequestDetailDrawer from '../components/RequestDetailDrawer';

const History = () => {
  const routerLocation = useLocation();

  // Search input state (with 400ms debounce)
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortVal, setSortVal] = useState('newest'); // newest | oldest | slowest | fastest | largest
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal & Drawer states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check query params on mount (pre-filtered by host)
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const hostParam = params.get('host');
    if (hostParam) {
      setSearchInput(hostParam);
      setSearch(hostParam);
      toast.info(`Filtered history by host: ${hostParam}`);
    }
  }, [routerLocation.search]);

  // Debounce Search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Resolve Sort metrics
  const getSortParams = () => {
    if (sortVal === 'oldest') return { sortBy: 'createdAt', sortOrder: 'asc' };
    if (sortVal === 'slowest') return { sortBy: 'responseTime', sortOrder: 'desc' };
    if (sortVal === 'fastest') return { sortBy: 'responseTime', sortOrder: 'asc' };
    if (sortVal === 'largest') return { sortBy: 'payloadSize', sortOrder: 'desc' };
    return { sortBy: 'createdAt', sortOrder: 'desc' }; // default: newest
  };

  const sortParam = getSortParams();

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, method, statusFilter, sortVal, limit]);

  // Fetch data using hook
  const { requests, pagination, loading, error, refetch } = useHistory({
    page,
    limit,
    search,
    method,
    filter: statusFilter,
    sortBy: sortParam.sortBy,
    sortOrder: sortParam.sortOrder
  });

  // Action: Single deletion
  const handleDeleteItem = async (id) => {
    const toastId = toast.loading('Deleting request log...');
    try {
      await deleteRequest(id);
      toast.success('Request log removed successfully.', { id: toastId });
      refetch();
    } catch (err) {
      toast.error('Failed to delete request log.', { id: toastId });
    }
  };

  // Action: Wipe all
  const handleWipeHistory = async () => {
    const toastId = toast.loading('Clearing request logs...');
    try {
      const res = await clearAllHistory();
      toast.success(`Cleared ${res.data.deleted} requests from database.`, { id: toastId });
      setIsConfirmModalOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to clear database logs.', { id: toastId });
    }
  };

  // UI Helpers (Simplified to white/border only)
  const getMethodBadgeColorClass = (m) => {
    return 'bg-bg text-primary border border-border';
  };

  const getStatusColorClass = (status) => {
    return 'text-primary bg-bg border-border';
  };

  const getScoreBadgeColorClass = (score) => {
    return 'bg-bg text-primary border border-border';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-primary">Request History</h1>
            <p className="text-secondary text-sm mt-1">Browse, filter, and inspect previously executed API requests.</p>
          </div>
        </div>
        <div>
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={requests.length === 0 && search === '' && method === 'All' && statusFilter === ''}
            className="w-full sm:w-auto border border-danger hover:bg-danger/10 text-danger text-xs font-semibold px-4 py-2.5 rounded-btn flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Clear All History
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-panel border border-border p-4 rounded-card shadow-card space-y-4">
        
        {/* Search & Select dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search URL */}
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by URL..."
              className="w-full bg-bg border border-border rounded-btn px-3.5 py-2.5 text-xs text-primary placeholder-secondary/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-bg border border-border rounded-btn px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">All Requests</option>
            <option value="success">Successful (2xx)</option>
            <option value="failed">Failed (4xx/5xx)</option>
            <option value="slow">Slow (&gt;1s)</option>
          </select>

          {/* Sort selection */}
          <select
            value={sortVal}
            onChange={(e) => setSortVal(e.target.value)}
            className="w-full bg-bg border border-border rounded-btn px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="slowest">Slowest First</option>
            <option value="fastest">Fastest First</option>
            <option value="largest">Largest Payload</option>
          </select>

        </div>

        {/* Method filter button groups */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mr-2">Method:</span>
          {['All', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-btn border transition-all ${
                method === m
                  ? 'bg-accent border-accent text-white'
                  : 'bg-bg border-border text-secondary hover:text-primary hover:border-secondary/35'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table area */}
      <div className="bg-panel border border-border rounded-card shadow-card overflow-hidden">
        
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <span className="text-xs text-secondary font-mono animate-pulse">[Loading logs...]</span>
          </div>
        )}

        {error && !loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <span className="text-sm font-semibold text-danger">[Error occurred]</span>
            <p className="text-xs text-secondary max-w-xs mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center p-8">
            {search || method !== 'All' || statusFilter ? (
              <>
                <h3 className="text-lg font-semibold text-primary mb-1">[No results]</h3>
                <p className="text-secondary text-sm max-w-xs">
                  No requests matched your query parameters. Reset filters or update search terms.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-primary mb-1">[History empty]</h3>
                <p className="text-secondary text-sm max-w-xs">
                  Run some API tests in the Request Analyzer to capture traffic histories.
                </p>
              </>
            )}
          </div>
        )}

        {/* Requests Table */}
        {!loading && !error && requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-bg/40 sticky top-0 border-b border-border z-10 font-semibold text-[10px] text-secondary uppercase tracking-wider select-none">
                <tr>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">URL</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Response Time</th>
                  <th className="p-3.5">Payload Size</th>
                  <th className="p-3.5">Protocol</th>
                  <th className="p-3.5">Security Score</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right font-mono">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 font-medium">
                {requests.map((r) => (
                  <tr 
                    key={r._id} 
                    className="bg-bg/15 hover:bg-[#1F2235] transition-colors"
                  >
                    {/* Method */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getMethodBadgeColorClass(r.method)}`}>
                        {r.method}
                      </span>
                    </td>

                    {/* URL */}
                    <td className="p-3.5 max-w-[300px] truncate font-mono text-primary font-medium" title={r.url}>
                      {r.url}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColorClass(r.status)}`}>
                        {r.status || '—'}
                      </span>
                    </td>

                    {/* Response Time */}
                    <td className="p-3.5 whitespace-nowrap font-mono font-bold text-primary">
                      {r.responseTime} ms
                    </td>

                    {/* Payload */}
                    <td className="p-3.5 whitespace-nowrap font-mono text-secondary">
                      {formatBytes(r.payloadSize)}
                    </td>

                    {/* Protocol */}
                    <td className="p-3.5 whitespace-nowrap">
                      {r.protocol === 'HTTPS' ? (
                        <span className="text-primary font-bold text-[10px] font-mono">
                          [HTTPS]
                        </span>
                      ) : (
                        <span className="text-secondary font-bold text-[10px] font-mono">
                          [HTTP]
                        </span>
                      )}
                    </td>

                    {/* Security Rating */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${getScoreBadgeColorClass(r.securityScore)}`}>
                        {r.securityScore}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="p-3.5 whitespace-nowrap text-secondary font-mono">
                      {timeAgo(r.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 whitespace-nowrap text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5 text-[10px]">
                        <button
                          onClick={() => {
                            setSelectedRequestId(r._id);
                            setIsDrawerOpen(true);
                          }}
                          className="bg-bg border border-border hover:border-accent text-secondary hover:text-accent px-2 py-1 rounded-btn transition-all font-mono"
                          title="Inspect details"
                        >
                          [Inspect]
                        </button>
                        <button
                          onClick={() => handleDeleteItem(r._id)}
                          className="bg-bg border border-border hover:border-danger text-secondary hover:text-danger px-2 py-1 rounded-btn transition-all font-mono"
                          title="Delete request"
                        >
                          [Delete]
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer Pagination controls */}
        {!loading && !error && requests.length > 0 && (
          <div className="bg-bg/20 px-4 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary select-none font-medium">
            <div>
              Showing <span className="text-primary font-semibold">{(page - 1) * limit + 1}</span>–
              <span className="text-primary font-semibold">{Math.min(page * limit, pagination.totalCount)}</span> of{' '}
              <span className="text-primary font-semibold">{pagination.totalCount}</span> results
            </div>

            {/* Pagination page number triggers */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(page - 1)}
                className="bg-bg border border-border hover:border-secondary/40 hover:text-primary px-2 py-1 rounded-btn disabled:opacity-40 disabled:hover:border-border transition-all font-semibold font-mono"
              >
                [Prev]
              </button>

              {Array.from({ length: pagination.totalPages }, (_, index) => {
                const pageNum = index + 1;
                // Display max 5 numbers centered around current page
                const shouldDisplay = 
                  pageNum === 1 || 
                  pageNum === pagination.totalPages || 
                  (pageNum >= page - 1 && pageNum <= page + 1);

                const isGap = 
                  (pageNum === 2 && page > 3) || 
                  (pageNum === pagination.totalPages - 1 && page < pagination.totalPages - 2);

                if (isGap) {
                  return <span key={pageNum} className="px-1 text-secondary/50 font-semibold font-mono">...</span>;
                }

                if (!shouldDisplay) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[28px] h-[28px] text-xs font-semibold rounded-btn border transition-all ${
                      page === pageNum
                        ? 'bg-accent border-accent text-white shadow-sm'
                        : 'bg-bg border-border text-secondary hover:text-primary hover:border-secondary/35'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
                className="bg-bg border border-border hover:border-secondary/40 hover:text-primary px-2 py-1 rounded-btn disabled:opacity-40 disabled:hover:border-border transition-all font-semibold font-mono"
              >
                [Next]
              </button>
            </div>

            {/* Items-per-page dropdown selector */}
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className="bg-bg border border-border rounded-btn px-2 py-1 text-xs text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer font-semibold"
              >
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

          </div>
        )}
      </div>

      {/* Confirmation Wiping Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsConfirmModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-panel border border-border rounded-card p-6 max-w-sm shadow-2xl z-10 w-full space-y-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-primary">[Clear all history?]</h3>
                <p className="text-secondary text-xs leading-relaxed">
                  This action cannot be undone. All request traces and metrics logs will be permanently deleted from MongoDB.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="bg-bg hover:bg-[#222533] border border-border text-secondary hover:text-primary py-2 px-3.5 rounded-btn transition-colors font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWipeHistory}
                className="bg-danger hover:bg-[#db3b3b] text-white py-2 px-3.5 rounded-btn transition-colors font-mono"
              >
                [Wipe]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Inspect Drawer */}
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

export default History;
