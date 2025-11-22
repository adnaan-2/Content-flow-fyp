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

// GET /api/posts/analytics - Get posts with analytics
router.get('/analytics', async (req, res) => {
  try {
    const Post = require('../models/Post');
    const SocialAccount = require('../models/SocialAccount');
    
    const posts = await Post.find({ userId: req.user.id })
      .populate('socialAccountId', 'platform accountName profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);

    // Format posts data for frontend
    const postsWithAnalytics = posts.map(post => ({
      _id: post._id,
      platform: post.platform,
      content: post.content,
      status: post.status,
      publishedTime: post.publishedTime,
      scheduledTime: post.scheduledTime,
      createdAt: post.createdAt,
      analytics: post.analytics,
      socialAccount: post.socialAccountId,
      postId: post.postId,
      errorMessage: post.errorMessage
    }));

    res.json({ success: true, posts: postsWithAnalytics });
  } catch (error) {
    console.error('Get posts analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/scheduled - Get scheduled posts
router.get('/scheduled', getScheduledPosts);

// GET /api/posts/scheduled/all - Get all scheduled posts
router.get('/scheduled/all', getAllScheduledPosts);

// DELETE /api/posts/scheduled/:postId - Cancel scheduled post
router.delete('/scheduled/:postId', cancelScheduledPost);

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', deletePost);

module.exports = router;