const express = require('express');
const router = express.Router();
const {
  schedulePost,
  getScheduledPosts,
  cancelScheduledPost,
  updateScheduledPost,
  getAllScheduledPosts
} = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// POST /api/schedule - Schedule a post
router.post('/', schedulePost);

// GET /api/schedule - Get pending scheduled posts
router.get('/', getScheduledPosts);

// GET /api/schedule/all - Get all scheduled posts
router.get('/all', getAllScheduledPosts);

// PUT /api/schedule/:postId - Update scheduled post
router.put('/:postId', updateScheduledPost);

// DELETE /api/schedule/:postId - Cancel scheduled post
router.delete('/:postId', cancelScheduledPost);

module.exports = router;