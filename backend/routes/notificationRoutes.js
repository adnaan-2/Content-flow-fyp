const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/notifications - Get all notifications for user
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', markAsRead);

// PUT /api/notifications/:id/unread - Mark notification as unread
router.put('/:id/unread', markAsUnread);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

// DELETE /api/notifications/:id - Delete specific notification
router.delete('/:id', deleteNotification);

// DELETE /api/notifications - Delete all notifications
router.delete('/', deleteAllNotifications);

module.exports = router;