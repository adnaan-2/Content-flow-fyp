const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/profile - Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/profile/update - Update user profile
router.put('/update', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { name }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/profile/change-password - Change user password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Save the new password
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;