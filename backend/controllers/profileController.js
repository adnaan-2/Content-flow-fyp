const User = require('../models/user');

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update fields if provided
    if (name) user.name = name;
    
    // Save the updated user
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    // In a real implementation, you would handle file upload
    // This is a placeholder assuming the file is already uploaded
    // and you have the file path
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const userId = req.user.id;
    const profilePicturePath = req.file.path;
    
    // Update the user's profile picture
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePicturePath },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { updateProfile, updateProfilePicture };