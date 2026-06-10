import express from 'express';
import { getGlobalInsights } from '../controllers/insightsController.js';

const router = express.Router();

router.get('/global', getGlobalInsights);

export default router;
