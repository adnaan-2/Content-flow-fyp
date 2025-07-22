const express = require('express');
const router = express.Router();
const Schedule = require('../models/schedule');
const Media = require('../models/media');
const auth = require('../middleware/auth');

// GET /api/schedule - Get all scheduled posts for a user
router.get('/', auth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ user: req.user.id })
      .sort({ scheduledDateTime: 1 })
      .populate('media', 'url originalname');
    
    res.json({ success: true, schedules });
  } catch (err) {
    console.error('Error fetching scheduled posts:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/schedule - Create a new scheduled post
router.post('/', auth, async (req, res) => {
  try {
    const { mediaId, scheduledDateTime, platforms, caption } = req.body;
    
    // Validate required fields
    if (!mediaId || !scheduledDateTime || !platforms || platforms.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Media, scheduled date/time, and platforms are required' 
      });
    }
    
    // Validate the media belongs to the user
    const media = await Media.findOne({ 
      _id: mediaId,
      user: req.user.id
    });
    
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }
    
    // Create new schedule
    const newSchedule = new Schedule({
      user: req.user.id,
      media: mediaId,
      scheduledDateTime,
      platforms,
      caption
    });
    
    const savedSchedule = await newSchedule.save();
    
    // Include media details in response
    const populatedSchedule = await Schedule.findById(savedSchedule._id)
      .populate('media', 'url originalname');
    
    // Log for demonstration purposes
    console.log(`Post scheduled for ${scheduledDateTime} to platforms: ${platforms.join(', ')}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Post scheduled successfully',
      schedule: populatedSchedule
    });
  } catch (err) {
    console.error('Error scheduling post:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/schedule/:id - Delete a scheduled post
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    
    await Schedule.deleteOne({ _id: schedule._id });
    
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (err) {
    console.error('Error deleting schedule:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;