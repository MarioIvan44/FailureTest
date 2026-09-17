import express from 'express';
import { getNotifications, markAsRead, deleteNotification } from '../controllers/notificationController.js';

const router = express.Router();

// Get all notifications
router.get('/', getNotifications);

// Mark as read
router.put('/:id/read', markAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

export default router;
