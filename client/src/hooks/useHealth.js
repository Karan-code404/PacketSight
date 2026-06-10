import { useState, useEffect, useCallback } from 'react';
import { getHealthSummary, getRecentFailures } from '../services/api';

/**
 * Custom hook to retrieve health state data in parallel
 * @returns {Object} hosts, failures, totalFailures, loading, error, refetch
 */
export function useHealth() {
  const [data, setData] = useState({
    hosts: [],
    failures: [],
    totalFailures: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, failuresRes] = await Promise.all([
        getHealthSummary(),
        getRecentFailures(20)
      ]);

      setData({
        hosts: summaryRes.data.hosts || [],
        failures: failuresRes.data.failures || [],
        totalFailures: failuresRes.data.totalFailures || 0
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to retrieve API health details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { ...data, loading, error, refetch: fetchHealth };
}
