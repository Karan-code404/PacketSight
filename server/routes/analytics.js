import express from 'express';
import {
  getOverviewStats,
  getResponseTimeTrend,
  getStatusDistribution,
  getPayloadDistribution,
  getTopHosts,
  getMethodDistribution,
  getHourlyActivity
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/overview', getOverviewStats);
router.get('/response-time-trend', getResponseTimeTrend);
router.get('/status-distribution', getStatusDistribution);
router.get('/payload-distribution', getPayloadDistribution);
router.get('/top-hosts', getTopHosts);
router.get('/method-distribution', getMethodDistribution);
router.get('/hourly-activity', getHourlyActivity);

export default router;
