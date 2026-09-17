import express from 'express';
import {
    getActiveAnnouncementBar,
    getAnnouncementBars,
    createAnnouncementBar,
    updateAnnouncementBar,
    deleteAnnouncementBar
} from '../controllers/announcementBarController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route - get active announcement
router.get('/active', getActiveAnnouncementBar);

// Admin routes
router.route('/')
    .get(protect, admin, getAnnouncementBars)
    .post(protect, admin, createAnnouncementBar);

router.route('/:id')
    .put(protect, admin, updateAnnouncementBar)
    .delete(protect, admin, deleteAnnouncementBar);

export default router;
