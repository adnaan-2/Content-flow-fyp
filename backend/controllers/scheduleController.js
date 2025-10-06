const ScheduledPost = require('../models/ScheduledPost');
const SocialAccount = require('../models/SocialAccount');
const schedule = require('node-schedule');
const { postToSocialMedia, getSocialAccount } = require('./postController');

// Store scheduled jobs
const scheduledJobs = new Map();

// Schedule a post
const schedulePost = async (req, res) => {
  try {
    const {
      caption,
      mediaUrls,
      mediaType = 'photo',
      platforms,
      scheduledTime,
      facebookPageId = null
    } = req.body;

    // Convert mediaUrls array to single mediaUrl for storage
    const mediaUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : null;

    const userId = req.user.id;

    // Validate input
    if (!platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'No platforms selected' });
    }

    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    if (!scheduledTime) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // Create scheduled post
    const scheduledPost = new ScheduledPost({
      user: userId,
      caption,
      mediaUrl,
      mediaType,
      platforms,
      scheduledTime: scheduleDate,
      facebookPageId
    });

    await scheduledPost.save();

    // Schedule the job
    const job = schedule.scheduleJob(scheduleDate, async () => {
      await executeScheduledPost(scheduledPost._id);
    });

    scheduledJobs.set(scheduledPost._id.toString(), job);

    res.json({
      message: 'Post scheduled successfully',
      scheduledPost
    });

  } catch (error) {
    console.error('Schedule post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Execute scheduled post
const executeScheduledPost = async (scheduledPostId) => {
  try {
    const scheduledPost = await ScheduledPost.findById(scheduledPostId);
    if (!scheduledPost || scheduledPost.status !== 'pending') {
      return;
    }

    // Update status to processing
    await ScheduledPost.findByIdAndUpdate(scheduledPostId, { status: 'processing' });

    // Get user's social accounts for selected platforms
    const results = [];
    
    for (const platform of scheduledPost.platforms) {
      try {
        const account = await getSocialAccount(scheduledPost.user, platform);

        if (!account) {
          console.log(`No ${platform} account found for user`);
          continue;
        }

        // Post to platform
        const content = {
          text: scheduledPost.caption,
          mediaUrls: scheduledPost.mediaUrl ? [scheduledPost.mediaUrl] : [],
          mediaType: scheduledPost.mediaType
        };

        console.log(`🔍 Scheduling Debug for ${platform}:`, {
          mediaUrl: scheduledPost.mediaUrl,
          mediaUrls: content.mediaUrls,
          mediaType: content.mediaType,
          hasMedia: content.mediaUrls && content.mediaUrls.length > 0
        });

        await postToSocialMedia(account, content, scheduledPost.facebookPageId);
        results.push({ platform, status: 'success' });

      } catch (error) {
        console.error(`Error posting to ${platform}:`, error);
        results.push({ platform, status: 'failed', error: error.message });
      }
    }

    // Check if all platforms failed
    const allFailed = results.every(r => r.status === 'failed');
    const status = allFailed ? 'failed' : 'posted';
    const errorMessage = allFailed ? results.map(r => r.error).join(', ') : null;

    // Update status
    await ScheduledPost.findByIdAndUpdate(scheduledPostId, {
      status,
      error: errorMessage
    });

    console.log(`Scheduled post ${scheduledPostId} executed with status: ${status}`);

    // Remove job from memory
    scheduledJobs.delete(scheduledPostId.toString());

  } catch (error) {
    console.error('Execute scheduled post error:', error);
    await ScheduledPost.findByIdAndUpdate(scheduledPostId, {
      status: 'failed',
      error: error.message
    });
  }
};

// Get scheduled posts
const getScheduledPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const scheduledPosts = await ScheduledPost.find({
      user: userId,
      status: 'pending',
      scheduledTime: { $gt: new Date() }
    }).sort({ scheduledTime: 1 });

    res.json({ scheduledPosts });

  } catch (error) {
    console.error('Get scheduled posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel scheduled post
const cancelScheduledPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const scheduledPost = await ScheduledPost.findOne({
      _id: postId,
      user: userId,
      status: 'pending'
    });

    if (!scheduledPost) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    // Cancel the job
    const job = scheduledJobs.get(postId);
    if (job) {
      job.cancel();
      scheduledJobs.delete(postId);
    }

    // Delete the scheduled post
    await ScheduledPost.findByIdAndDelete(postId);

    res.json({ message: 'Scheduled post cancelled successfully' });

  } catch (error) {
    console.error('Cancel scheduled post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all scheduled posts (including completed/failed)
const getAllScheduledPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const scheduledPosts = await ScheduledPost.find(query)
      .sort({ createdAt: -1 });

    res.json({ scheduledPosts });

  } catch (error) {
    console.error('Get all scheduled posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Initialize scheduler (restore jobs on server start)
const initializeScheduler = async () => {
  try {
    const pendingPosts = await ScheduledPost.find({
      status: 'pending',
      scheduledTime: { $gt: new Date() }
    });

    for (const post of pendingPosts) {
      const job = schedule.scheduleJob(post.scheduledTime, async () => {
        await executeScheduledPost(post._id);
      });
      scheduledJobs.set(post._id.toString(), job);
    }

    console.log(`✅ Restored ${pendingPosts.length} scheduled jobs`);

  } catch (error) {
    console.error('❌ Error initializing scheduler:', error);
  }
};

// Update scheduled post
const updateScheduledPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const {
      caption,
      mediaUrls,
      mediaType = 'photo',
      platforms,
      scheduledTime,
      facebookPageId = null
    } = req.body;

    // Convert mediaUrls array to single mediaUrl for storage
    const mediaUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : null;

    const userId = req.user.id;

    // Find the scheduled post
    const scheduledPost = await ScheduledPost.findOne({
      _id: postId,
      user: userId
    });

    if (!scheduledPost) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    // Only allow updating pending posts
    if (scheduledPost.status !== 'pending') {
      return res.status(400).json({ error: 'Can only update pending posts' });
    }

    // Validate input
    if (!platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'No platforms selected' });
    }

    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    if (!scheduledTime) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // Cancel the existing job if it exists
    const existingJob = scheduledJobs.get(postId);
    if (existingJob) {
      existingJob.cancel();
      scheduledJobs.delete(postId);
    }

    // Update the scheduled post
    scheduledPost.caption = caption;
    scheduledPost.mediaUrl = mediaUrl;
    scheduledPost.mediaType = mediaType;
    scheduledPost.platforms = platforms;
    scheduledPost.scheduledTime = scheduleDate;
    scheduledPost.facebookPageId = facebookPageId;

    await scheduledPost.save();

    // Schedule the new job
    const job = schedule.scheduleJob(scheduleDate, async () => {
      await executeScheduledPost(postId);
    });

    scheduledJobs.set(postId, job);

    res.json({
      message: 'Scheduled post updated successfully',
      scheduledPost
    });

  } catch (error) {
    console.error('Update scheduled post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  schedulePost,
  getScheduledPosts,
  cancelScheduledPost,
  updateScheduledPost,
  getAllScheduledPosts,
  initializeScheduler
};