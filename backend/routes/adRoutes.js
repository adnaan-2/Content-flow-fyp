const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (reuse existing config)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'domensaip',
  api_key: process.env.CLOUDINARY_API_KEY || '593481785444475',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pR-MvTUpcys5iYG5grvvU_8phoM'
});

// POST /api/ads/generate - Generate ad with FLUX.1
router.post('/generate', auth, async (req, res) => {
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
          step3: 'Generate a new token with "Inference" permission enabled',
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

    // Call Hugging Face FLUX.1 API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
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
            num_inference_steps: 4 // FLUX.1-schnell works well with 4 steps
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      
      if (response.status === 401) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Hugging Face API key. Please check your API key.',
          instructions: {
            step1: 'Go to https://huggingface.co/settings/tokens',
            step2: 'Check if your token is valid and has proper permissions',
            step3: 'Update HUGGINGFACE_API_KEY in your .env file',
            step4: 'Restart the server'
          }
        });
      }
      
      if (response.status === 403) {
        return res.status(400).json({
          success: false,
          message: 'Your Hugging Face API token needs "Inference" permissions.',
          instructions: {
            step1: 'Go to https://huggingface.co/settings/tokens',
            step2: 'Delete your current token',
            step3: 'Create a new token with "Make calls to the serverless Inference API" permission enabled',
            step4: 'Copy the new token to your .env file as HUGGINGFACE_API_KEY',
            step5: 'Restart the server',
            note: 'The token needs "Inference" permissions, not just "Read" permissions'
          }
        });
      }
      
      if (response.status === 503) {
        return res.status(503).json({
          success: false,
          message: 'AI model is loading. Please try again in a minute.',
          retryAfter: 60
        });
      }
      
      return res.status(response.status).json({
        success: false,
        message: `API request failed: ${response.status}`,
        details: errorText
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

    res.json({
      success: true,
      message: 'Ad generated successfully',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      prompt: enhancedPrompt
    });

  } catch (error) {
    console.error('Error generating ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ad',
      error: error.message
    });
  }
});

// GET /api/ads/presets - Get preset styles and templates
router.get('/presets', (req, res) => {
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
});

module.exports = router;
