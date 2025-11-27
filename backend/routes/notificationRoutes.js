const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

// Get notifications with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false,
      type = null 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };

    const result = await NotificationService.getNotifications(req.user.id, options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count' 
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read' 
    });
  }
});

// Delete specific notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await NotificationService.deleteNotification(req.params.id, req.user.id);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
});

// Delete all notifications
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const result = await NotificationService.deleteAllNotifications(req.user.id);
    
    res.json({
      success: true,
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete all notifications' 
    });
  }
});

// Test endpoint to create a notification manually
router.post('/test', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Creating test notification for user:', req.user.id);
    
    const notification = await NotificationService.postPublishFailed(
      req.user.id, 
      ['Instagram'], 
      'This is a test notification to verify the system is working', 
      'Test post content'
    );
    
    res.json({
      success: true,
      message: 'Test notification created',
      notification
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create test notification',
      error: error.message
    });
  }
});

module.exports = router;