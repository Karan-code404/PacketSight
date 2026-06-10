import express from 'express';
import {
  getHealthSummary,
  getRecentFailures,
  getHostUptime
} from '../controllers/healthController.js';

const router = express.Router();

router.get('/summary', getHealthSummary);
router.get('/failures', getRecentFailures);
router.get('/uptime/:host', getHostUptime);

export default router;
