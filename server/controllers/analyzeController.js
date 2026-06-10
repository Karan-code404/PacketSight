import axios from 'axios';
import Request from '../models/Request.js';
import { generateInsights } from '../utils/insightGenerator.js';

export const analyzeRequest = async (req, res) => {
  const { url, method = 'GET', headers = {}, body = '' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  // Validate and parse URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format. Please include protocol (http:// or https://).' });
  }

  const protocol = parsedUrl.protocol.toUpperCase().replace(':', '');
  const host = parsedUrl.hostname;
  const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (protocol === 'HTTPS' ? 443 : 80);

  // Parse custom headers
  const reqHeaders = {};
  if (Array.isArray(headers)) {
    headers.forEach(h => {
      if (h.key && h.key.trim()) {
        reqHeaders[h.key.trim()] = h.value || '';
      }
    });
  } else if (typeof headers === 'object') {
    Object.keys(headers).forEach(k => {
      if (k.trim()) {
        reqHeaders[k.trim()] = headers[k] || '';
      }
    });
  }

  // Set default Content-Type if not provided
  const headerKeysLower = Object.keys(reqHeaders).map(k => k.toLowerCase());
  if (!headerKeysLower.includes('content-type') && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  // Prepare body data
  let requestData = null;
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
    try {
      requestData = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (err) {
      requestData = body;
    }
  }

  const startTime = Date.now();

  try {
    // Execute target HTTP request with axios
    const response = await axios({
      method: method.toUpperCase(),
      url: url,
      headers: reqHeaders,
      data: requestData,
      timeout: 15000,
      validateStatus: () => true
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Calculate response properties
    const rawResponseBody = typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data);
    
    const payloadSize = Buffer.byteLength(rawResponseBody, 'utf8');

    const resHeaders = response.headers || {};
    const getHeaderValue = (name) => {
      const key = Object.keys(resHeaders).find(k => k.toLowerCase() === name.toLowerCase());
      return key ? resHeaders[key] : null;
    };

    const hasHeader = (name) => getHeaderValue(name) !== null;

    // Check security headers (case-insensitive)
    const securityHeaders = {
      'content-security-policy': hasHeader('content-security-policy'),
      'strict-transport-security': hasHeader('strict-transport-security'),
      'x-frame-options': hasHeader('x-frame-options'),
      'x-content-type-options': hasHeader('x-content-type-options'),
      'referrer-policy': hasHeader('referrer-policy')
    };

    // Calculate Security Score
    let score = 100;
    if (protocol !== 'HTTPS') {
      score -= 30;
    }
    Object.values(securityHeaders).forEach(present => {
      if (!present) {
        score -= 10;
      }
    });
    const securityScore = Math.max(0, score);

    const contentType = getHeaderValue('content-type') || 'text/plain';
    const connectionType = getHeaderValue('connection') || 'close';

    // Protocol Version detection
    let protocolVersion = 'HTTP/1.1';
    if (response.request && response.request.res && response.request.res.httpVersion) {
      protocolVersion = `HTTP/${response.request.res.httpVersion}`;
    } else if (getHeaderValue('x-firefox-spdy')) {
      protocolVersion = 'HTTP/2';
    }

    // Capture protocol intelligence fields
    const protocolIntel = {
      scheme: protocol,
      host,
      port,
      connectionType: getHeaderValue('connection') || '—',
      contentEncoding: getHeaderValue('content-encoding') || '—',
      transferEncoding: getHeaderValue('transfer-encoding') || '—',
      server: getHeaderValue('server') || '—',
      cacheControl: getHeaderValue('cache-control') || '—',
      contentType,
      protocolVersion
    };

    // Evaluate Insights
    const requestMetrics = {
      responseTime,
      payloadSize,
      protocol,
      securityScore,
      status: response.status
    };
    const insights = generateInsights(requestMetrics);

    // Save scan to MongoDB (including protocolIntelligence)
    const requestLog = new Request({
      url,
      method: method.toUpperCase(),
      requestHeaders: reqHeaders,
      requestBody: typeof body === 'string' ? body : JSON.stringify(body),
      status: response.status,
      responseTime,
      payloadSize,
      protocol,
      host,
      port,
      responseHeaders: resHeaders,
      contentType,
      responseBody: rawResponseBody,
      securityScore,
      protocolIntelligence: protocolIntel
    });
    await requestLog.save();

    // Fetch historical benchmarks for this host
    const stats = await Request.aggregate([
      { $match: { host } },
      {
        $group: {
          _id: null,
          averageResponseTime: { $avg: '$responseTime' },
          fastestResponseTime: { $min: '$responseTime' },
          slowestResponseTime: { $max: '$responseTime' },
          totalRequests: { $sum: 1 }
        }
      }
    ]);

    const performance = stats.length > 0 ? {
      averageResponseTime: Math.round(stats[0].averageResponseTime),
      fastestResponseTime: stats[0].fastestResponseTime,
      slowestResponseTime: stats[0].slowestResponseTime,
      totalRequests: stats[0].totalRequests
    } : {
      averageResponseTime: responseTime,
      fastestResponseTime: responseTime,
      slowestResponseTime: responseTime,
      totalRequests: 1
    };

    return res.status(200).json({
      requestId: requestLog._id,
      status: response.status,
      statusText: response.statusText || 'OK',
      responseTime,
      payloadSize,
      protocol,
      host,
      port,
      contentType,
      connectionType,
      requestHeaders: reqHeaders,
      responseHeaders: resHeaders,
      responseBody: rawResponseBody,
      securityScore,
      securityHeaders,
      performance,
      protocolIntelligence: protocolIntel,
      insights
    });

  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout');

    if (isTimeout) {
      return res.status(408).json({ error: 'Request timed out after 15 seconds.' });
    }

    return res.status(400).json({ error: 'Unable to reach the API. Check the URL and network.' });
  }
};
