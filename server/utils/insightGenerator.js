/**
 * Generates smart insights for a given request trace log.
 * @param {Object} requestData - The request details from Axios and calculations
 * @returns {Array<Object>} List of generated insights
 */
export function generateInsights(requestData) {
  const { responseTime, payloadSize, protocol, securityScore, status } = requestData;
  const insights = [];

  // Rule 1: Response Time (Slow)
  if (responseTime > 1000) {
    insights.push({
      type: 'warning',
      category: 'Performance',
      message: 'API response is unusually slow (over 1s). Consider optimizing database queries or adding caching.',
      icon: 'Timer'
    });
  }

  // Rule 2: Payload Size (Large)
  if (payloadSize > 1000000) {
    insights.push({
      type: 'warning',
      category: 'Performance',
      message: 'Large response payload detected. This may cause high bandwidth usage.',
      icon: 'Package'
    });
  }

  // Rule 3: Security - HTTP
  if (protocol === 'HTTP' || protocol === 'http') {
    insights.push({
      type: 'critical',
      category: 'Security',
      message: 'Insecure HTTP protocol used. Data is not encrypted. Switch to HTTPS.',
      icon: 'ShieldAlert'
    });
  }

  // Rule 4: Security - Missing Headers / Poor Security Score
  if (securityScore < 70) {
    insights.push({
      type: 'warning',
      category: 'Security',
      message: 'Crucial security headers are missing (e.g., CSP, HSTS). Your API might be vulnerable.',
      icon: 'Unlock'
    });
  }

  // Rule 5: Reliability - Server Error
  if (status >= 500) {
    insights.push({
      type: 'critical',
      category: 'Reliability',
      message: 'Server error detected. The upstream API is failing.',
      icon: 'ServerCrash'
    });
  }

  // Rule 6: Success - Optimal Performance
  if (status === 200 && responseTime < 300 && securityScore > 90) {
    insights.push({
      type: 'success',
      category: 'General',
      message: 'API is performing optimally with excellent security.',
      icon: 'CheckCircle'
    });
  }

  return insights;
}
