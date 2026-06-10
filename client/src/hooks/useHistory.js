import { useState, useEffect, useCallback } from 'react';
import { getHistory } from '../services/api';

/**
 * Manages request history fetch queries, paginations, and loader states
 * @param {Object} filters - Parameters for query limits, offsets, searching, method, and sorting
 * @returns {Object} requests, pagination, loading, error, refetch
 */
export default function useHistory(filters) {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHistory(filters);
      setRequests(response.data.requests || []);
      setPagination(response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to retrieve request history.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // Serialize filters object to prevent excessive re-renders

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { requests, pagination, loading, error, refetch: fetchHistory };
}
