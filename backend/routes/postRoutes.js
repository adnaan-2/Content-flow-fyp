const express = require('express');
const router = express.Router();
const axios = require('axios');
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

// GET /api/posts/test - Test endpoint without auth (for demo)
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test endpoint hit - fetching all posts');
    const Post = require('../models/Post');
    
    const posts = await Post.find({})
      .populate('socialAccountId', 'platform accountName')
      .sort({ createdAt: -1 });

    console.log('📊 Found', posts.length, 'posts in database');
    
    // Debug each post
    posts.forEach((post, index) => {
      console.log(`Post ${index + 1}: ${post.platform} - URL: ${post.platformUrl || 'NO URL'}`);
    });

    const formattedPosts = posts.map(post => ({
      _id: post._id,
      platform: post.platform,
      content: post.content || {},
      status: post.status,
      publishedTime: post.publishedTime,
      createdAt: post.createdAt,
      platformUrl: post.platformUrl, // This should be included
      postId: post.postId,
      analytics: post.analytics || { likes: 0, comments: 0, shares: 0, views: 0 },
      socialAccount: post.socialAccountId
    }));

    console.log('✅ Formatted', formattedPosts.length, 'posts');
    console.log('🔗 Posts with URLs:', formattedPosts.filter(p => p.platformUrl).length);
    
    res.json({ success: true, posts: formattedPosts });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply auth middleware to all routes
router.use(authenticateToken);

// POST /api/posts/now - Post immediately to social media
router.post('/now', postNow);

// POST /api/posts/schedule - Schedule a post
router.post('/schedule', schedulePost);

// GET /api/posts - Get user's posts
router.get('/', getUserPosts);

// GET /api/posts/analytics - Simple posts endpoint
router.get('/analytics', async (req, res) => {
  try {
    console.log('📊 Fetching posts for user:', req.user.id);
    const Post = require('../models/Post');
    const SocialAccount = require('../models/SocialAccount');
    const GRAPH_BASE = 'https://graph.facebook.com/v18.0';

    // Fetch all posts for the user
    const posts = await Post.find({ userId: req.user.id })
      .populate('socialAccountId', 'platform accountName profilePicture platformData')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${posts.length} posts`);

    // Enrich analytics with real-time likes/comments for IG and FB
    for (const post of posts) {
      if (post.status !== 'published') continue;
      try {
        const accId = post.socialAccountId?._id || post.socialAccountId;
        const account = await SocialAccount.findById(accId);
        if (!account) continue;

        if (post.platform === 'instagram' && post.postId && post.postId !== 'scheduled' && post.postId !== 'failed') {
          const url = `${GRAPH_BASE}/${post.postId}`;
          const { data } = await axios.get(url, {
            params: { fields: 'like_count,comments_count', access_token: account.accessToken }
          });
          post.analytics = {
            ...(post.analytics || {}),
            likes: typeof data.like_count === 'number' ? data.like_count : (post.analytics?.likes || 0),
            comments: typeof data.comments_count === 'number' ? data.comments_count : (post.analytics?.comments || 0)
          };
        }

        if (post.platform === 'facebook' && post.postId && post.postId !== 'scheduled' && post.postId !== 'failed') {
          // Prefer page token when available
          let token = account.accessToken;
          const pageId = post.facebookPageId;
          if (pageId && Array.isArray(account.platformData?.pages)) {
            const page = account.platformData.pages.find(p => p.id === pageId);
            if (page?.accessToken) token = page.accessToken;
          }
          const url = `${GRAPH_BASE}/${post.postId}`;
          let likesCount = 0;
          let commentsCount = 0;
          try {
            // Try reactions first (works for Post nodes)
            const { data } = await axios.get(url, {
              params: { fields: 'reactions.summary(true),comments.summary(true)', access_token: token }
            });
            likesCount = data.reactions?.summary?.total_count || 0;
            commentsCount = data.comments?.summary?.total_count || 0;
          } catch (err) {
            const msg = err.response?.data?.error?.message || '';
            // Fallback to likes on Photo nodes
            if (msg.includes('nonexisting field (reactions)')) {
              const { data } = await axios.get(url, {
                params: { fields: 'likes.summary(true),comments.summary(true)', access_token: token }
              });
              likesCount = data.likes?.summary?.total_count || 0;
              commentsCount = data.comments?.summary?.total_count || 0;
            } else {
              throw err;
            }
          }
          post.analytics = {
            ...(post.analytics || {}),
            likes: likesCount,
            comments: commentsCount,
            shares: post.analytics?.shares || 0
          };
        }
      } catch (e) {
        console.warn('Analytics enrichment failed for post', post._id, e.response?.data || e.message);
      }
    }

    // Format output
    const formattedPosts = posts.map(post => ({
      _id: post._id,
      platform: post.platform,
      content: post.content || {},
      status: post.status,
      publishedTime: post.publishedTime,
      scheduledTime: post.scheduledTime,
      createdAt: post.createdAt,
      platformUrl: post.platformUrl,
      postId: post.postId,
      facebookPageId: post.facebookPageId,
      analytics: post.analytics || {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        engagement: 0,
        reach: 0
      },
      socialAccount: post.socialAccountId,
      errorMessage: post.errorMessage
    }));

    console.log(`📤 Sending ${formattedPosts.length} enriched posts to frontend`);
    res.json({ success: true, posts: formattedPosts });
  } catch (error) {
    console.error('Get posts analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch posts analytics'
    });
  }
});



// GET /api/posts/scheduled/all - Get all scheduled posts
router.get('/scheduled/all', getAllScheduledPosts);

// DELETE /api/posts/scheduled/:postId - Cancel scheduled post
router.delete('/scheduled/:postId', cancelScheduledPost);

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', deletePost);

// GET /api/posts/debug - Debug endpoint to check posts status
router.get('/debug', async (req, res) => {
  try {
    const Post = require('../models/Post');
    const SocialAccount = require('../models/SocialAccount');
    
    const totalPosts = await Post.countDocuments({ userId: req.user.id });
    const socialAccounts = await SocialAccount.find({ userId: req.user.id });
    
    const postsByStatus = await Post.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const postsByPlatform = await Post.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      debug: {
        userId: req.user.id,
        totalPosts,
        connectedAccounts: socialAccounts.length,
        accounts: socialAccounts.map(acc => ({
          platform: acc.platform,
          accountName: acc.accountName,
          isActive: acc.isActive
        })),
        postsByStatus,
        postsByPlatform
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/posts/test - Create test post for debugging
router.post('/test', async (req, res) => {
  try {
    const Post = require('../models/Post');
    const SocialAccount = require('../models/SocialAccount');
    
    console.log('Creating test post for user:', req.user.id);
    
    // Find any connected social account for test
    let socialAccount = await SocialAccount.findOne({ userId: req.user.id });
    
    if (!socialAccount) {
      // Create a dummy social account for testing purposes
      console.log('No social accounts found, creating dummy account for test');
      socialAccount = new SocialAccount({
        userId: req.user.id,
        platform: 'facebook',
        accountId: 'test_account_123',
        accountName: 'Test Account',
        accessToken: 'test_token',
        isActive: true,
        platformData: {
          profilePicture: null
        }
      });
      await socialAccount.save();
      console.log('Dummy social account created:', socialAccount._id);
    }
    
    // Create test post
    const testPost = new Post({
      userId: req.user.id,
      socialAccountId: socialAccount._id,
      platform: socialAccount.platform,
      postId: `test_${Date.now()}`,
      content: {
        text: 'This is a test post to verify the posts system is working',
        mediaUrls: [],
        mediaType: 'text'
      },
      publishedTime: new Date(),
      status: 'published',
      analytics: {
        likes: Math.floor(Math.random() * 50) + 10,
        comments: Math.floor(Math.random() * 20) + 5,
        shares: Math.floor(Math.random() * 10) + 2,
        views: Math.floor(Math.random() * 200) + 50,
        engagement: Math.floor(Math.random() * 5) + 2,
        reach: Math.floor(Math.random() * 300) + 100
      }
    });
    
    await testPost.save();
    console.log('Test post created:', testPost._id);
    
    res.json({
      success: true,
      message: 'Test post created successfully',
      post: testPost
    });
  } catch (error) {
    console.error('Test post creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create test post'
    });
  }
});

module.exports = router;