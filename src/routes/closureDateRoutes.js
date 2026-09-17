import express from 'express';
import { getClosureDates, addClosureDate, deleteClosureDate, updateClosureDate } from '../controllers/closureDateController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route - anyone can view closure dates
router.get('/', getClosureDates);

// Protected routes - only authenticated users can modify
router.post('/', protect, addClosureDate);
router.patch('/:id', protect, updateClosureDate);
router.delete('/:id', protect, deleteClosureDate);

export default router;
