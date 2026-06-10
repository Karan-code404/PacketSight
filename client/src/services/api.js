import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeRequest = async (requestData) => {
  const response = await api.post('/analyze', requestData);
  return response.data;
};

// History endpoints
export const getHistory = (params) => api.get('/history', { params });
export const getRequestById = (id) => api.get(`/history/${id}`);
export const deleteRequest = (id) => api.delete(`/history/${id}`);
export const clearAllHistory = () => api.delete('/history', { data: { confirm: true } });

// Analytics endpoints
export const getAnalyticsOverview = () => api.get('/analytics/overview');
export const getResponseTimeTrend = (limit = 30) => api.get('/analytics/response-time-trend', { params: { limit } });
export const getStatusDistribution = () => api.get('/analytics/status-distribution');
export const getPayloadDistribution = () => api.get('/analytics/payload-distribution');
export const getTopHosts = () => api.get('/analytics/top-hosts');
export const getMethodDistribution = () => api.get('/analytics/method-distribution');
export const getHourlyActivity = () => api.get('/analytics/hourly-activity');

// Health endpoints
export const getHealthSummary = () => api.get('/health/summary');
export const getRecentFailures = (limit = 20) => api.get('/health/failures', { params: { limit } });
export const getHostUptime = (host) => api.get(`/health/uptime/${host}`);

// Insights endpoints
export const getGlobalInsights = () => api.get('/insights/global');

export default api;
