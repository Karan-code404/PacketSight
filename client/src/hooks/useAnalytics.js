import { useState, useEffect, useCallback } from 'react';
import {
  getAnalyticsOverview,
  getResponseTimeTrend,
  getStatusDistribution,
  getPayloadDistribution,
  getTopHosts,
  getMethodDistribution,
  getHourlyActivity
} from '../services/api';

/**
 * Custom hook to retrieve all dashboard analytics endpoints in parallel
 * @param {Number} limit - Limit of requests trend parameters (e.g. 10, 30, 50)
 * @returns {Object} overview, trend, statusDist, payloadDist, topHosts, methodDist, hourlyActivity, loading, error, refetch
 */
export function useAnalytics(limit = 30) {
  const [data, setData] = useState({
    overview: null,
    trend: [],
    statusDist: [],
    payloadDist: [],
    topHosts: [],
    methodDist: [],
    hourlyActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        trendRes,
        statusRes,
        payloadRes,
        hostsRes,
        methodRes,
        hourlyRes
      ] = await Promise.all([
        getAnalyticsOverview(),
        getResponseTimeTrend(limit),
        getStatusDistribution(),
        getPayloadDistribution(),
        getTopHosts(),
        getMethodDistribution(),
        getHourlyActivity()
      ]);

      setData({
        overview: overviewRes.data,
        trend: trendRes.data.trend || [],
        statusDist: statusRes.data.distribution || [],
        payloadDist: payloadRes.data.distribution || [],
        topHosts: hostsRes.data.hosts || [],
        methodDist: methodRes.data.distribution || [],
        hourlyActivity: hourlyRes.data.activity || []
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to retrieve analytics data.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { ...data, loading, error, refetch: fetchAnalytics };
}
