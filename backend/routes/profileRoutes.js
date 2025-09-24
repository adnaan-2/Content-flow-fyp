const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// Set up multer upload with memory storage
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
router.get('/', authenticateToken, profileController.getProfile);

// PUT /api/profile/update - Update user profile
router.put('/update', authenticateToken, profileController.updateProfile);

// PUT /api/profile/change-password - Change user password
router.put('/change-password', authenticateToken, profileController.changePassword);

// POST /api/profile/upload-photo - Upload profile photo
router.post('/upload-photo', authenticateToken, upload.single('profilePhoto'), profileController.uploadProfilePhoto);

// GET /api/profile/test - Test route
router.get('/test', profileController.testEndpoint);

// POST /api/profile/image - Simple profile photo upload
router.post('/image', authenticateToken, upload.single('profilePhoto'), profileController.uploadImage);

// DELETE /api/profile/delete-photo - Delete profile photo
router.delete('/delete-photo', authenticateToken, profileController.deleteProfilePhoto);

module.exports = router;