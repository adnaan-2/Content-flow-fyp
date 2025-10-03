const express = require('express');
const router = express.Router();
const {
  postNow,
  schedulePost,
  getUserPosts,
  getScheduledPosts,
  cancelScheduledPost,
  deletePost,
  getSchedulerStatus,
  testInstagramPosting,
  testXPosting
} = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// POST /api/posts/now - Post immediately to social media
router.post('/now', postNow);

// POST /api/posts/schedule - Schedule a post
router.post('/schedule', schedulePost);

// GET /api/posts - Get user's posts with filtering
router.get('/', getUserPosts);

// GET /api/posts/scheduled - Get scheduled posts
router.get('/scheduled', getScheduledPosts);

// PUT /api/posts/:postId/cancel - Cancel scheduled post
router.put('/:postId/cancel', cancelScheduledPost);

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', deletePost);

// GET /api/posts/scheduler/status - Get scheduler status (for debugging)
router.get('/scheduler/status', getSchedulerStatus);

// POST /api/posts/test/instagram - Test Instagram posting
router.post('/test/instagram', testInstagramPosting);

// POST /api/posts/test/x - Test X posting
router.post('/test/x', testXPosting);

// Debug endpoint to log incoming requests
router.post('/debug', (req, res) => {
  console.log('🔍 Debug endpoint called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  console.log('User:', req.user);
  res.json({ 
    message: 'Debug info logged', 
    received: req.body,
    user: req.user?.id
  });
});

module.exports = router;