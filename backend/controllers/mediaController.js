const cloudinary = require('cloudinary').v2;
const Media = require('../models/media');
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'domensaip',
  api_key: process.env.CLOUDINARY_API_KEY || '593481785444475',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pR-MvTUpcys5iYG5grvvU_8phoM'
});

// Get all media files for a user
exports.getAllMedia = async (req, res) => {
  try {
    const media = await Media.find({ user: req.user.id })
      .sort({ createdAt: -1 }); // Newest first
    
    res.json({ success: true, media });
  } catch (err) {
    console.error('Error fetching media:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upload media files directly to Cloudinary without local storage
exports.uploadMedia = async (req, res) => {
  console.log('Media upload route hit');
  console.log('Files received:', req.files?.length || 0);
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded. Please select some media files.' 
      });
    }
    
    const uploadedMedia = [];
    
    // Upload each file directly to Cloudinary using stream
    for (let file of req.files) {
      console.log(`Uploading: ${file.originalname}`);
      
      // Stream upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'contentflow/media',
            transformation: [{ width: 1200, crop: 'limit' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        // Stream file buffer directly to Cloudinary
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
      
      console.log(`Cloudinary upload successful: ${result.secure_url}`);
      
      // Save to database
      const newMedia = new Media({
        user: req.user.id,
        url: result.secure_url,
        publicId: result.public_id,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      const savedMedia = await newMedia.save();
      uploadedMedia.push(savedMedia);
    }
    
    console.log(`Successfully uploaded ${uploadedMedia.length} files`);
    
    res.json({
      success: true,
      message: `${uploadedMedia.length} file(s) uploaded successfully`,
      media: uploadedMedia
    });
    
  } catch (err) {
    console.error('Error uploading media:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during upload',
      error: err.message
    });
  }
};

// Delete media file
exports.deleteMedia = async (req, res) => {
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
};