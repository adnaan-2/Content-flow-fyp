const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'domensaip',
  api_key: process.env.CLOUDINARY_API_KEY || '593481785444475',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pR-MvTUpcys5iYG5grvvU_8phoM'
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profile');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `profile-${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for profile photos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed for profile photos.'), false);
    }
  }
});

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

// POST /api/profile/upload-photo - Upload profile photo
router.post('/upload-photo', auth, upload.single('profilePhoto'), async (req, res) => {
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

    // Upload new photo to Cloudinary in profile folder
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'contentflow/profiles',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    // Delete local file after upload
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting local file:', unlinkErr);
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

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('Error uploading profile photo:', err.message);
    
    // Delete local file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting local file after error:', unlinkErr);
      });
    }
    
    res.status(500).json({ success: false, message: 'Server error during photo upload' });
  }
});

// GET /api/profile/test - Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Profile routes working!' });
});

// POST /api/profile/image - Simple profile photo upload
router.post('/image', auth, upload.single('profilePhoto'), async (req, res) => {
  console.log('Route hit: /api/profile/image');
  console.log('Request file:', req.file);
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please select an image file.' 
      });
    }

    console.log('File received:', req.file.originalname, req.file.size);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'contentflow/profiles',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' }
      ]
    });

    console.log('Cloudinary upload successful:', result.secure_url);

    // Delete local file
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting local file:', unlinkErr);
    });

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

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      profilePhoto: result.secure_url,
      user: updatedUser
    });

  } catch (err) {
    console.error('Error uploading profile photo:', err);
    
    // Delete local file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting local file after error:', unlinkErr);
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during photo upload',
      error: err.message
    });
  }
});

// DELETE /api/profile/delete-photo - Delete profile photo
router.delete('/delete-photo', auth, async (req, res) => {
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

    res.json({
      success: true,
      message: 'Profile photo deleted successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('Error deleting profile photo:', err.message);
    res.status(500).json({ success: false, message: 'Server error during photo deletion' });
  }
});

module.exports = router;