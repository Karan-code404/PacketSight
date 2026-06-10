import Request from '../models/Request.js';

// GET /api/analytics/overview
export const getOverviewStats = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments({});
    if (totalRequests === 0) {
      return res.status(200).json({
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalDataTransferred: 0,
        uniqueHosts: 0,
        slowRequests: 0,
        failedRequests: 0,
        httpsPercentage: 0
      });
    }

    const successCount = await Request.countDocuments({ status: { $gte: 200, $lt: 300 } });
    const slowCount = await Request.countDocuments({ responseTime: { $gt: 1000 } });
    
    const failedCount = await Request.countDocuments({
      $or: [
        { status: { $gte: 400 } },
        { status: { $lt: 200 } },
        { status: null },
        { status: { $exists: false } }
      ]
    });
    
    const httpsCount = await Request.countDocuments({ protocol: 'HTTPS' });

    const avgRes = await Request.aggregate([
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$responseTime' },
          totalSize: { $sum: '$payloadSize' }
        }
      }
    ]);

    const uniqueHostsList = await Request.distinct('host');

    const successRate = parseFloat(((successCount / totalRequests) * 100).toFixed(1));
    const httpsPercentage = parseFloat(((httpsCount / totalRequests) * 100).toFixed(1));
    const averageResponseTime = avgRes.length > 0 ? Math.round(avgRes[0].avgTime) : 0;
    const totalDataTransferred = avgRes.length > 0 ? avgRes[0].totalSize : 0;

    return res.status(200).json({
      totalRequests,
      successRate,
      averageResponseTime,
      totalDataTransferred,
      uniqueHosts: uniqueHostsList.length,
      slowRequests: slowCount,
      failedRequests: failedCount,
      httpsPercentage
    });
  } catch (error) {
    console.error('Error in getOverviewStats:', error);
    return res.status(500).json({ error: 'Server error retrieving overview statistics.' });
  }
};

// GET /api/analytics/response-time-trend
export const getResponseTimeTrend = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const requests = await Request.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('responseTime url createdAt');

    // Reverse to chronological order (oldest first)
    const trend = requests.reverse().map((r, idx) => ({
      index: idx + 1,
      responseTime: r.responseTime,
      url: r.url,
      timestamp: r.createdAt
    }));

    return res.status(200).json({ trend });
  } catch (error) {
    console.error('Error in getResponseTimeTrend:', error);
    return res.status(500).json({ error: 'Server error fetching latency trend.' });
  }
};

// GET /api/analytics/status-distribution
export const getStatusDistribution = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments({});
    if (totalRequests === 0) {
      return res.status(200).json({ distribution: [] });
    }

    const success = await Request.countDocuments({ status: { $gte: 200, $lt: 300 } });
    const redirect = await Request.countDocuments({ status: { $gte: 300, $lt: 400 } });
    const clientError = await Request.countDocuments({ status: { $gte: 400, $lt: 500 } });
    
    const serverError = await Request.countDocuments({
      $or: [
        { status: { $gte: 500 } },
        { status: { $lt: 200 } },
        { status: null },
        { status: { $exists: false } }
      ]
    });

    const distribution = [
      { category: '2xx Success', count: success, percentage: parseFloat(((success / totalRequests) * 100).toFixed(1)) },
      { category: '3xx Redirect', count: redirect, percentage: parseFloat(((redirect / totalRequests) * 100).toFixed(1)) },
      { category: '4xx Client Error', count: clientError, percentage: parseFloat(((clientError / totalRequests) * 100).toFixed(1)) },
      { category: '5xx Server Error', count: serverError, percentage: parseFloat(((serverError / totalRequests) * 100).toFixed(1)) }
    ];

    return res.status(200).json({ distribution });
  } catch (error) {
    console.error('Error in getStatusDistribution:', error);
    return res.status(500).json({ error: 'Server error fetching status distribution.' });
  }
};

// GET /api/analytics/payload-distribution
export const getPayloadDistribution = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments({});
    if (totalRequests === 0) {
      return res.status(200).json({ distribution: [] });
    }

    const small = await Request.countDocuments({ payloadSize: { $lt: 10000 } }); // <10KB
    const medium = await Request.countDocuments({ payloadSize: { $gte: 10000, $lt: 100000 } }); // 10-100KB
    const large = await Request.countDocuments({ payloadSize: { $gte: 100000 } }); // >100KB

    const distribution = [
      { category: 'Small (< 10KB)', count: small, percentage: parseFloat(((small / totalRequests) * 100).toFixed(1)) },
      { category: 'Medium (10–100KB)', count: medium, percentage: parseFloat(((medium / totalRequests) * 100).toFixed(1)) },
      { category: 'Large (> 100KB)', count: large, percentage: parseFloat(((large / totalRequests) * 100).toFixed(1)) }
    ];

    return res.status(200).json({ distribution });
  } catch (error) {
    console.error('Error in getPayloadDistribution:', error);
    return res.status(500).json({ error: 'Server error fetching payload distribution.' });
  }
};

// GET /api/analytics/top-hosts
export const getTopHosts = async (req, res) => {
  try {
    const hostsStats = await Request.aggregate([
      {
        $group: {
          _id: '$host',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          successCount: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$status', 200] }, { $lt: ['$status', 300] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          host: '$_id',
          count: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 0] },
          successRate: { $round: [{ $multiply: [{ $divide: ['$successCount', '$count'] }, 100] }, 1] }
        }
      }
    ]);

    return res.status(200).json({ hosts: hostsStats });
  } catch (error) {
    console.error('Error in getTopHosts:', error);
    return res.status(500).json({ error: 'Server error fetching top hosts.' });
  }
};

// GET /api/analytics/method-distribution
export const getMethodDistribution = async (req, res) => {
  try {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const distribution = [];

    for (const m of methods) {
      const count = await Request.countDocuments({ method: m });
      distribution.push({ method: m, count });
    }

    return res.status(200).json({ distribution });
  } catch (error) {
    console.error('Error in getMethodDistribution:', error);
    return res.status(500).json({ error: 'Server error fetching method distribution.' });
  }
};

// GET /api/analytics/hourly-activity
export const getHourlyActivity = async (req, res) => {
  try {
    const aggregation = await Request.aggregate([
      {
        $project: {
          hour: { $hour: { date: '$createdAt', timezone: 'Asia/Kolkata' } }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format all 24 hours of day
    const activity = Array.from({ length: 24 }, (_, hour) => {
      const match = aggregation.find(item => item._id === hour);
      return { hour, count: match ? match.count : 0 };
    });

    return res.status(200).json({ activity });
  } catch (error) {
    console.error('Error in getHourlyActivity:', error);
    return res.status(500).json({ error: 'Server error fetching hourly activity.' });
  }
};
