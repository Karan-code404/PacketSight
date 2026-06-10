import express from 'express';
import { 
  getHistory, 
  getRequestById, 
  deleteRequest, 
  clearAllHistory 
} from '../controllers/historyController.js';

const router = express.Router();

router.get('/', getHistory);
router.get('/:id', getRequestById);
router.delete('/:id', deleteRequest);
router.delete('/', clearAllHistory);

export default router;
