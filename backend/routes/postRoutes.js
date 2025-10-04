const express = require('express');
const router = express.Router();
const {
  postNow,
  getUserPosts,
  deletePost
} = require('../controllers/postController');
const {
  schedulePost,
  getScheduledPosts,
  cancelScheduledPost,
  getAllScheduledPosts
} = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// POST /api/posts/now - Post immediately to social media
router.post('/now', postNow);

// POST /api/posts/schedule - Schedule a post
router.post('/schedule', schedulePost);

// GET /api/posts - Get user's posts
router.get('/', getUserPosts);

// GET /api/posts/scheduled - Get scheduled posts
router.get('/scheduled', getScheduledPosts);

// GET /api/posts/scheduled/all - Get all scheduled posts
router.get('/scheduled/all', getAllScheduledPosts);

// DELETE /api/posts/scheduled/:postId - Cancel scheduled post
router.delete('/scheduled/:postId', cancelScheduledPost);

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', deletePost);

module.exports = router;