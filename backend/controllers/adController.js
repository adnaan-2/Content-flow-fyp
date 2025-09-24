const cloudinary = require('cloudinary').v2;
const GeneratedAd = require('../models/GeneratedAd');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'domensaip',
  api_key: process.env.CLOUDINARY_API_KEY || '593481785444475',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pR-MvTUpcys5iYG5grvvU_8phoM'
});

// Generate ad with AI models
exports.generateAd = async (req, res) => {
  try {
    // Dynamic import for node-fetch (ES module)
    const fetch = (await import('node-fetch')).default;
    
    const { prompt, style, dimensions } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    console.log('Generating ad with prompt:', prompt);

    // Check if API key is configured
    if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your_huggingface_api_key_here') {
      return res.status(400).json({
        success: false,
        message: 'Hugging Face API key is not configured. Please add HUGGINGFACE_API_KEY to your .env file.',
        instructions: {
          step1: 'Go to https://huggingface.co/settings/tokens',
          step2: 'Create a free account if you don\'t have one',
          step3: 'Generate a new token (Read access is sufficient)',
          step4: 'Add HUGGINGFACE_API_KEY=your_token_here to your .env file',
          step5: 'Restart the server'
        }
      });
    }

    // Enhanced prompt for marketing ads
    const enhancedPrompt = `Professional marketing poster, ${prompt}, 
      modern design, clean layout, high quality, commercial photography style, 
      vibrant colors, eye-catching, ${style || 'professional'} style, 
      8k resolution, advertising design`;

    // Try multiple API endpoints and add timeout
    const apiEndpoints = [
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1'
    ];

    let response = null;
    let lastError = null;

    // Try each endpoint with timeout
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_your_api_key_here'}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
              width: dimensions?.width || 1024,
              height: dimensions?.height || 1024,
              guidance_scale: 7.5,
              num_inference_steps: endpoint.includes('FLUX') ? 4 : 20
            }
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`Successfully connected to: ${endpoint}`);
          break;
        } else {
          console.log(`Endpoint ${endpoint} returned status: ${response.status}`);
          lastError = new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error.message);
        lastError = error;
        response = null;
      }
    }

    // If all endpoints failed, try a fallback solution
    if (!response || !response.ok) {
      console.log('All AI endpoints failed, checking for network connectivity...');
      
      // Test basic connectivity
      try {
        const testResponse = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          timeout: 5000 
        });
        if (!testResponse.ok) {
          throw new Error('Network connectivity test failed');
        }
        console.log('Network connectivity is working');
      } catch (connectivityError) {
        console.error('Network connectivity issue:', connectivityError.message);
        return res.status(503).json({
          success: false,
          message: 'Network connectivity issue detected. Please check your internet connection or firewall settings.',
          error: 'NETWORK_ERROR',
          details: {
            originalError: lastError?.message || 'Unknown error',
            suggestion: 'Try again in a few minutes or contact your network administrator'
          }
        });
      }

      // If network is fine but API is failing, create a placeholder image
      if (lastError?.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'AI service is temporarily unavailable due to DNS/network issues.',
          error: 'DNS_ERROR',
          details: {
            suggestion: 'This might be a temporary network issue. Please try again in a few minutes.'
          }
        });
      }

      // For development/testing: Create a placeholder response
      console.log('Creating placeholder response for development...');
      return res.status(503).json({
        success: false,
        message: 'AI model service is temporarily unavailable. Please try again later.',
        error: 'SERVICE_UNAVAILABLE',
        details: {
          lastError: lastError?.message || 'Unknown error',
          suggestion: 'Please try again in a few minutes',
          fallback: 'Consider using a VPN or checking firewall settings if this persists'
        }
      });
    }

    // Get image buffer from response
    const imageBuffer = await response.buffer();
    
    console.log('Image generated, uploading to Cloudinary...');

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'contentflow/generated-ads',
          resource_type: 'image',
          format: 'png'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(imageBuffer);
    });

    console.log('Upload successful:', uploadResult.secure_url);

    // Save generated ad to database
    const generatedAd = new GeneratedAd({
      user: req.user.id,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      prompt: prompt,
      enhancedPrompt: enhancedPrompt,
      style: style || 'professional',
      dimensions: {
        width: dimensions?.width || 1024,
        height: dimensions?.height || 1024
      }
    });

    await generatedAd.save();
    console.log('Generated ad saved to database');

    res.json({
      success: true,
      message: 'Ad generated successfully',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      prompt: enhancedPrompt,
      adId: generatedAd._id
    });

  } catch (error) {
    console.error('Error generating ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ad',
      error: error.message
    });
  }
};

// Get all generated ads for the current user
exports.getMyAds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const generatedAds = await GeneratedAd.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');

    const total = await GeneratedAd.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      ads: generatedAds,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAds: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching generated ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch generated ads',
      error: error.message
    });
  }
};

// Delete a generated ad
exports.deleteAd = async (req, res) => {
  try {
    const ad = await GeneratedAd.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Generated ad not found'
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(ad.publicId);

    // Delete from database
    await GeneratedAd.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Generated ad deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting generated ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete generated ad',
      error: error.message
    });
  }
};

// Get preset styles and templates
exports.getPresets = (req, res) => {
  const presets = {
    styles: [
      { id: 'professional', name: 'Professional', description: 'Clean, corporate design' },
      { id: 'modern', name: 'Modern', description: 'Trendy, contemporary look' },
      { id: 'minimalist', name: 'Minimalist', description: 'Simple, clean design' },
      { id: 'vibrant', name: 'Vibrant', description: 'Bold, colorful design' },
      { id: 'elegant', name: 'Elegant', description: 'Sophisticated, refined look' },
      { id: 'playful', name: 'Playful', description: 'Fun, energetic design' }
    ],
    dimensions: [
      { id: 'square', name: 'Square (1:1)', width: 1024, height: 1024, description: 'Instagram posts' },
      { id: 'landscape', name: 'Landscape (16:9)', width: 1024, height: 576, description: 'Facebook ads' },
      { id: 'portrait', name: 'Portrait (9:16)', width: 576, height: 1024, description: 'Instagram stories' },
      { id: 'banner', name: 'Banner (3:1)', width: 1024, height: 341, description: 'Website banners' }
    ],
    templates: [
      'Product showcase with modern background',
      'Service promotion with call-to-action',
      'Brand awareness with logo placement',
      'Event promotion with date and venue',
      'Sale announcement with discount highlight',
      'App promotion with device mockup'
    ]
  };

  res.json({ success: true, presets });
};