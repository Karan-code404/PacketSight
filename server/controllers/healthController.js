import Request from '../models/Request.js';

// GET /api/health/summary
export const getHealthSummary = async (req, res) => {
  try {
    const uniqueHosts = await Request.distinct('host');
    const hostsList = [];

    for (const h of uniqueHosts) {
      const totalRequests = await Request.countDocuments({ host: h });
      const successCount = await Request.countDocuments({ host: h, status: { $gte: 200, $lt: 300 } });
      const failureCount = totalRequests - successCount;

      const avgData = await Request.aggregate([
        { $match: { host: h } },
        { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
      ]);
      const avgResponseTime = avgData.length > 0 ? Math.round(avgData[0].avgTime) : 0;

      const latest = await Request.findOne({ host: h }).sort({ createdAt: -1 });
      const availability = totalRequests > 0 ? parseFloat(((successCount / totalRequests) * 100).toFixed(1)) : 0;

      const lastStatus = latest ? latest.status : null;
      const lastChecked = latest ? latest.createdAt : null;

      // Determine Health Status
      let healthStatus = 'healthy';
      if (availability < 70 || avgResponseTime > 3000 || (lastStatus && lastStatus >= 500)) {
        healthStatus = 'critical';
      } else if ((availability >= 70 && availability < 90) || (avgResponseTime >= 1000 && avgResponseTime <= 3000)) {
        healthStatus = 'warning';
      }

      // Fetch last 3 non-2xx errors
      const errors = await Request.find({
        host: h,
        $or: [
          { status: { $gte: 400 } },
          { status: { $lt: 200 } },
          { status: null },
          { status: { $exists: false } }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('status createdAt');

      const recentErrors = errors.map(e => ({
        status: e.status || 0,
        timestamp: e.createdAt
      }));

      hostsList.push({
        host: h,
        totalRequests,
        successCount,
        failureCount,
        availability,
        avgResponseTime,
        lastChecked,
        lastStatus,
        healthStatus,
        recentErrors
      });
    }

    return res.status(200).json({ hosts: hostsList });
  } catch (error) {
    console.error('Error in getHealthSummary:', error);
    return res.status(500).json({ error: 'Server error retrieving health summary.' });
  }
};

// GET /api/health/failures
export const getRecentFailures = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const query = {
      $or: [
        { status: { $gte: 400 } },
        { status: { $lt: 200 } },
        { status: null },
        { status: { $exists: false } }
      ]
    };

    const failures = await Request.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    const totalFailures = await Request.countDocuments(query);

    return res.status(200).json({ failures, totalFailures });
  } catch (error) {
    console.error('Error in getRecentFailures:', error);
    return res.status(500).json({ error: 'Server error retrieving recent failures.' });
  }
};

// GET /api/health/uptime/:host
export const getHostUptime = async (req, res) => {
  try {
    const { host } = req.params;
    const totalRequests = await Request.countDocuments({ host });

    if (totalRequests === 0) {
      return res.status(404).json({ error: `No request history found for host ${host}` });
    }

    const successCount = await Request.countDocuments({ host, status: { $gte: 200, $lt: 300 } });
    const failureCount = totalRequests - successCount;
    const uptimePercentage = parseFloat(((successCount / totalRequests) * 100).toFixed(1));

    // Compile daily sparkline counts for the last 7 calendar days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTotal = await Request.countDocuments({
        host,
        createdAt: { $gte: date, $lt: nextDate }
      });
      const daySuccess = await Request.countDocuments({
        host,
        status: { $gte: 200, $lt: 300 },
        createdAt: { $gte: date, $lt: nextDate }
      });
      const dayFailed = dayTotal - daySuccess;

      const dateString = date.toISOString().split('T')[0];
      last7Days.push({
        date: dateString,
        total: dayTotal,
        success: daySuccess,
        failed: dayFailed
      });
    }

    return res.status(200).json({
      host,
      uptimePercentage,
      totalRequests,
      successCount,
      failureCount,
      last7Days
    });
  } catch (error) {
    console.error('Error in getHostUptime:', error);
    return res.status(500).json({ error: 'Server error retrieving host uptime details.' });
  }
};
