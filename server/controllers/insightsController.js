import Request from '../models/Request.js';

// GET /api/insights/global
export const getGlobalInsights = async (req, res) => {
  try {
    const requests = await Request.find({}).sort({ createdAt: -1 }).limit(100);

    let slowCount = 0;
    let largePayloadCount = 0;
    let insecureCount = 0;
    let poorSecurityCount = 0;
    let serverErrorCount = 0;

    requests.forEach(r => {
      if (r.responseTime > 1000) slowCount++;
      if (r.payloadSize > 1000000) largePayloadCount++;
      if (r.protocol === 'HTTP' || r.protocol === 'http') insecureCount++;
      if (r.securityScore < 70) poorSecurityCount++;
      if (r.status >= 500) serverErrorCount++;
    });

    const issues = [];

    if (insecureCount > 0) {
      issues.push({
        category: 'Security',
        count: insecureCount,
        message: 'requests were sent using insecure HTTP protocol.',
        impact: 'High',
        action: 'Update routing rules to force TLS/SSL and switch to HTTPS.',
        type: 'critical'
      });
    }

    if (serverErrorCount > 0) {
      issues.push({
        category: 'Reliability',
        count: serverErrorCount,
        message: 'requests failed with server error codes (5xx).',
        impact: 'High',
        action: 'Inspect system daemon records and backend application stack trace logs.',
        type: 'critical'
      });
    }

    if (slowCount > 0) {
      issues.push({
        category: 'Performance',
        count: slowCount,
        message: 'requests were unusually slow (over 1s).',
        impact: 'Medium',
        action: 'Optimize database queries, review server resource consumption, or enable caching.',
        type: 'warning'
      });
    }

    if (poorSecurityCount > 0) {
      issues.push({
        category: 'Security',
        count: poorSecurityCount,
        message: 'requests were returned with missing security headers (e.g. CSP, HSTS).',
        impact: 'Medium',
        action: 'Configure reverse-proxy or API gateways to append CSP and HSTS headers.',
        type: 'warning'
      });
    }

    if (largePayloadCount > 0) {
      issues.push({
        category: 'Performance',
        count: largePayloadCount,
        message: 'requests returned large response payloads.',
        impact: 'Low',
        action: 'Enable GZIP compression, paginate records, or truncate returned fields.',
        type: 'warning'
      });
    }

    // Sort by frequency
    issues.sort((a, b) => b.count - a.count);

    return res.status(200).json({ issues });
  } catch (error) {
    console.error('Error in getGlobalInsights:', error);
    return res.status(500).json({ error: 'Server error retrieving global insights.' });
  }
};
