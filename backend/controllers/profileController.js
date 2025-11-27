const User = require('../models/User');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { sendPasswordChangeSuccessEmail } = require('../utils/emailService');
const deviceUtils = require('../utils/deviceUtils');
const NotificationService = require('../utils/notificationService');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'domensaip',
  api_key: process.env.CLOUDINARY_API_KEY || '593481785444475',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pR-MvTUpcys5iYG5grvvU_8phoM'
});

// Get user profile
exports.getProfile = async (req, res) => {
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
};

// Update user profile
exports.updateProfile = async (req, res) => {
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

    // Create profile update notification
    try {
      await NotificationService.profileUpdated(req.user.id, 'Profile information updated successfully');
      console.log('📢 Profile update notification created for user:', req.user.id);
    } catch (notificationError) {
      console.error('Profile update notification error:', notificationError);
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
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

    // Create password change notification
    try {
      const deviceInfo = deviceUtils.getDeviceInfo(req);
      await NotificationService.profileUpdated(req.user.id, `Password changed successfully from ${deviceInfo.device} (${deviceInfo.os})`);
      console.log('📢 Password change notification created for user:', req.user.id);
    } catch (notificationError) {
      console.error('Password change notification error:', notificationError);
    }

    // Send security email notification
    try {
      const deviceInfo = deviceUtils.getDeviceInfo(req);
      const changeTime = new Date().toLocaleString();
      await sendPasswordChangeSuccessEmail(user.email, user.name, changeTime, deviceInfo);
      console.log('📧 Password change security email sent to:', user.email);
    } catch (emailError) {
      console.error('📧 Password change email error:', emailError);
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upload profile photo using memory buffer
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Get current user to check for existing profile photo
    const currentUser = await User.findById(req.user.id);
    
    // Delete old profile photo from Cloudinary if it exists
    if (currentUser.profilePhoto && currentUser.profilePhotoPublicId) {
      try {
        await cloudinary.uploader.destroy(currentUser.profilePhotoPublicId);
      } catch (deleteError) {
        console.error('Error deleting old profile photo:', deleteError);
      }
    }

    // Upload new photo to Cloudinary directly from buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'contentflow/profiles',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Stream file buffer directly to Cloudinary
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // Update user with new profile photo
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        profilePhoto: result.secure_url,
        profilePhotoPublicId: result.public_id
      },
      { new: true }
    ).select('-password');

    // Create profile photo update notification
    try {
      await NotificationService.profileUpdated(req.user.id, 'Profile photo updated successfully');
      console.log('📢 Profile photo update notification created for user:', req.user.id);
    } catch (notificationError) {
      console.error('Profile photo notification error:', notificationError);
    }

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('Error uploading profile photo:', err.message);
    res.status(500).json({ success: false, message: 'Server error during photo upload' });
  }
};

// Simple profile photo upload
exports.uploadImage = async (req, res) => {
  console.log('Route hit: /api/profile/image');
  console.log('Request file:', req.file ? 'File received' : 'No file');
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please select an image file.' 
      });
    }

    console.log('File received:', req.file.originalname, req.file.size);

    // Upload to Cloudinary from buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'contentflow/profiles',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Stream file buffer directly to Cloudinary
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    console.log('Cloudinary upload successful:', result.secure_url);

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        profilePhoto: result.secure_url,
        profilePhotoPublicId: result.public_id
      },
      { new: true }
    ).select('-password');

    console.log('User updated successfully');

    // Create profile photo update notification
    try {
      await NotificationService.profileUpdated(req.user.id, 'Profile photo uploaded successfully');
      console.log('📢 Profile photo upload notification created for user:', req.user.id);
    } catch (notificationError) {
      console.error('Profile photo upload notification error:', notificationError);
    }

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      profilePhoto: result.secure_url,
      user: updatedUser
    });

  } catch (err) {
    console.error('Error uploading profile photo:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during photo upload',
      error: err.message
    });
  }
};

// Delete profile photo
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.profilePhoto || !user.profilePhotoPublicId) {
      return res.status(400).json({ success: false, message: 'No profile photo to delete' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(user.profilePhotoPublicId);

    // Update user to remove profile photo
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $unset: {
          profilePhoto: 1,
          profilePhotoPublicId: 1
        }
      },
      { new: true }
    ).select('-password');

    // Create profile photo delete notification
    try {
      await NotificationService.profileUpdated(req.user.id, 'Profile photo removed successfully');
      console.log('📢 Profile photo delete notification created for user:', req.user.id);
    } catch (notificationError) {
      console.error('Profile photo delete notification error:', notificationError);
    }

    res.json({
      success: true,
      message: 'Profile photo deleted successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('Error deleting profile photo:', err.message);
    res.status(500).json({ success: false, message: 'Server error during photo deletion' });
  }
};

// Test endpoint
exports.testEndpoint = (req, res) => {
  res.json({ success: true, message: 'Profile routes working!' });
};