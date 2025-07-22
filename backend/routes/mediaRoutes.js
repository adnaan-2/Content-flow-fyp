const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const Media = require('../models/media');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'domensaip',
  api_key: process.env.CLOUDINARY_API_KEY || '593481785444475',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pR-MvTUpcys5iYG5grvvU_8phoM'
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage locally first
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Update the multer configuration to increase the file size limit

// Set up multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Increase to 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

// GET /api/media - Get all media files for a user
router.get('/', auth, async (req, res) => {
  try {
    const media = await Media.find({ user: req.user.id })
      .sort({ createdAt: -1 }); // Newest first
    
    res.json({ success: true, media });
  } catch (err) {
    console.error('Error fetching media:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/media/upload - Upload new media
router.post('/upload', auth, upload.array('media', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    
    const mediaFiles = [];
    const uploadPromises = [];
    
    // Upload each file to Cloudinary
    for (let file of req.files) {
      const uploadPromise = new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          file.path,
          {
            folder: 'contentflow_media',
            transformation: [{ width: 1200, crop: 'limit' }]
          },
          (error, result) => {
            // Delete local file after upload
            fs.unlink(file.path, (unlinkErr) => {
              if (unlinkErr) console.error('Error deleting local file:', unlinkErr);
            });
            
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              // Create new media document
              const newMedia = new Media({
                user: req.user.id,
                url: result.secure_url,
                publicId: result.public_id,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
              });
              
              // Save to database and resolve promise
              newMedia.save()
                .then(savedMedia => {
                  mediaFiles.push(savedMedia);
                  resolve();
                })
                .catch(saveErr => reject(saveErr));
            }
          }
        );
      });
      
      uploadPromises.push(uploadPromise);
    }
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
    
    res.json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      media: mediaFiles
    });
  } catch (err) {
    console.error('Error uploading media:', err.message);
    
    // Delete local files if they exist
    for (const file of req.files || []) {
      fs.unlink(file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting local file after error:', unlinkErr);
      });
    }
    
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
});

// DELETE /api/media/:id - Delete media file
router.delete('/:id', auth, async (req, res) => {
  try {
    const media = await Media.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }
    
    // Delete from Cloudinary
    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId);
    }
    
    // Delete from database
    await Media.deleteOne({ _id: media._id });
    
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (err) {
    console.error('Error deleting media:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;