import express from 'express';
import { getAllStoreHours, updateStoreHours, bulkUpdateStoreHours } from '../controllers/storeHoursController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllStoreHours);
router.put('/bulk', protect, admin, bulkUpdateStoreHours);
router.put('/:day', protect, admin, updateStoreHours);

export default router;
