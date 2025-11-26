const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// For Gemini AI
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

router.get('/', (req, res) => {
  res.json({ msg: 'Caption route works' });
});

// Generate AI caption for social media posts
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { images, platforms, currentCaption, prompt } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'No images provided for caption generation' });
    }

    // Create context for AI based on user's content
    const platformText = platforms && platforms.length > 0 ? platforms.join(', ') : 'social media';
    
    // Create descriptions of the images
    const imageDescriptions = images.map((img, index) => {
      let description = `Image ${index + 1}`;
      if (img.originalname) description += `: ${img.originalname}`;
      if (img.prompt) description += ` (AI Generated: ${img.prompt})`;
      if (img.type) description += ` (${img.type})`;
      return description;
    }).join('\n');

    // Create comprehensive prompt for Gemini
    const aiPrompt = `
Create an engaging social media caption for the following content:

Target Platform(s): ${platformText}
Number of images: ${images.length}

Content Details:
${imageDescriptions}

${currentCaption ? `Current caption to improve/reference: "${currentCaption}"` : ''}
${prompt ? `User's specific request: "${prompt}"` : ''}

Requirements:
- Create an engaging, authentic caption
- Make it suitable for ${platformText}
- Include 3-5 relevant hashtags
- Keep it concise but impactful (ideal length: 100-200 characters)
- Make it sound natural and conversational
- Consider current trends and engagement
- Match the tone appropriate for the platform(s)

${currentCaption ? 
  'Either enhance the existing caption or create a completely new one based on what would work better.' : 
  'Generate a fresh, creative caption that will drive engagement.'
}

Return only the final caption text with hashtags, no explanations or additional formatting.
    `;

    // Generate caption using Gemini - try AI Studio free tier models
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    let result = null;
    let usedModel = null;
    
    for (const modelName of modelNames) {
      try {
        result = await genAI.models.generateContent({
          model: modelName,
          contents: aiPrompt
        });
        usedModel = modelName;
        break;
      } catch (modelError) {
        if (modelName === modelNames[modelNames.length - 1]) {
          // If this was the last model, throw the error
          throw modelError;
        }
        // Continue to next model
        continue;
      }
    }
    
    if (!result || !result.text) {
      throw new Error('No response received from any AI model');
    }

    // Handle different response structures
    let generatedCaption;
    if (typeof result.text === 'function') {
      generatedCaption = result.text().trim();
    } else if (typeof result.text === 'string') {
      generatedCaption = result.text.trim();
    } else if (result.response && result.response.text) {
      generatedCaption = typeof result.response.text === 'function' 
        ? result.response.text().trim() 
        : result.response.text.trim();
    } else {
      // Try to extract text from the response object
      generatedCaption = JSON.stringify(result).trim();
    }
    
    // Clean up the response (remove any quotes or formatting)
    const cleanCaption = generatedCaption.replace(/^["']|["']$/g, '').trim();

    res.json({ 
      success: true,
      caption: cleanCaption
    });

  } catch (error) {
    console.error('AI caption generation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate caption';
    let statusCode = 500;
    
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      errorMessage = 'AI service authentication error - please check API key';
      statusCode = 401;
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorMessage = 'AI service quota exceeded - please try again later';
      statusCode = 429;
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      errorMessage = 'AI model not available - using fallback service';
      statusCode = 503;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error - please check your internet connection';
      statusCode = 503;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
