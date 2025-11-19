const cloudinary = require('cloudinary').v2;
const GeneratedAd = require('../models/GeneratedAd');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'domensaip',
  api_key: process.env.CLOUDINARY_API_KEY || '593481785444475',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pR-MvTUpcys5iYG5grvvU_8phoM'
});

// DeepAI API configuration
const DEEPAI_API_KEY = process.env.DEEPAI_API_KEY || '372|5T4fa3n2WNwnqJK0nOp7V4K87sdKAUc0IccoJEOf02ce2b09';

// Smart context-aware enhancement function
function createContextAwareEnhancement(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Advanced context analysis with multiple keyword matching
  let primaryContext = '';
  let visualStyle = '';
  let composition = '';
  let lighting = '';
  let colorPalette = '';
  let textPlacement = '';
  let targetAudience = '';
  
  // Enhanced context detection with more specific categories
  if (lowerPrompt.match(/\b(food|restaurant|meal|cooking|recipe|chef|dining|cuisine|delicious|tasty|hungry)\b/)) {
    primaryContext = 'mouth-watering culinary advertisement photography';
    visualStyle = 'appetizing close-up composition with steam effects and fresh ingredients';
    lighting = 'warm, natural kitchen lighting with soft shadows';
    colorPalette = 'rich, warm tones with appetizing golden highlights';
    textPlacement = 'minimal overlay text preserving food focus';
    targetAudience = 'food enthusiasts and restaurant customers';
  } else if (lowerPrompt.match(/\b(fashion|clothing|style|outfit|trendy|designer|model|wear|apparel|chic)\b/)) {
    primaryContext = 'high-fashion commercial photography';
    visualStyle = 'editorial-style composition with model poses and fabric details';
    lighting = 'dramatic studio lighting with fashion-forward shadows';
    colorPalette = 'sophisticated color scheme with brand-appropriate tones';
    textPlacement = 'stylish typography complementing fashion aesthetic';
    targetAudience = 'fashion-conscious consumers and style influencers';
  } else if (lowerPrompt.match(/\b(tech|technology|gadget|phone|app|software|digital|innovation|smart)\b/)) {
    primaryContext = 'cutting-edge technology showcase';
    visualStyle = 'sleek, minimalist design with product focus and UI elements';
    lighting = 'cool, crisp LED lighting with subtle tech reflections';
    colorPalette = 'modern tech colors with electric blues and clean whites';
    textPlacement = 'clean, modern typography with tech specifications';
    targetAudience = 'tech enthusiasts and early adopters';
  } else if (lowerPrompt.match(/\b(fitness|gym|workout|health|exercise|sports|training|athletic)\b/)) {
    primaryContext = 'dynamic fitness and wellness photography';
    visualStyle = 'energetic action shots with movement and determination';
    lighting = 'high-contrast lighting emphasizing muscle definition and energy';
    colorPalette = 'vibrant, motivational colors with energy-boosting highlights';
    textPlacement = 'bold, motivational text with fitness metrics';
    targetAudience = 'fitness enthusiasts and health-conscious individuals';
  } else if (lowerPrompt.match(/\b(beauty|skincare|makeup|cosmetics|spa|wellness|glow|radiant)\b/)) {
    primaryContext = 'luxurious beauty and wellness photography';
    visualStyle = 'soft, glamorous composition with skin texture details and product elegance';
    lighting = 'flattering beauty lighting with gentle highlights and minimal shadows';
    colorPalette = 'soft, elegant tones with luxury beauty aesthetics';
    textPlacement = 'elegant typography with beauty benefits and luxury appeal';
    targetAudience = 'beauty enthusiasts and luxury consumers';
  } else if (lowerPrompt.match(/\b(car|vehicle|automotive|drive|luxury|speed|performance|road)\b/)) {
    primaryContext = 'premium automotive commercial photography';
    visualStyle = 'dynamic vehicle positioning with aerodynamic emphasis and luxury details';
    lighting = 'dramatic automotive lighting highlighting curves, chrome, and performance features';
    colorPalette = 'sophisticated automotive colors with metallic accents';
    textPlacement = 'powerful automotive typography with performance specifications';
    targetAudience = 'automotive enthusiasts and luxury car buyers';
  } else if (lowerPrompt.match(/\b(travel|vacation|destination|adventure|explore|journey|wanderlust)\b/)) {
    primaryContext = 'inspiring travel and adventure photography';
    visualStyle = 'breathtaking landscape composition with adventure elements and cultural highlights';
    lighting = 'golden hour or scenic natural lighting with atmospheric depth';
    colorPalette = 'vibrant travel colors with natural landscape tones';
    textPlacement = 'adventurous typography with destination highlights';
    targetAudience = 'travel enthusiasts and adventure seekers';
  } else if (lowerPrompt.match(/\b(business|professional|corporate|office|success|career|leadership)\b/)) {
    primaryContext = 'corporate professional commercial imagery';
    visualStyle = 'confident business composition with success indicators and professional environment';
    lighting = 'bright, trustworthy office lighting conveying competence and reliability';
    colorPalette = 'professional business colors with trust-building blues and success-oriented tones';
    textPlacement = 'authoritative business typography with credibility markers';
    targetAudience = 'business professionals and corporate decision-makers';
  } else if (lowerPrompt.match(/\b(event|party|celebration|festival|concert|entertainment|fun)\b/)) {
    primaryContext = 'vibrant event and entertainment photography';
    visualStyle = 'energetic celebration composition with crowd engagement and festive atmosphere';
    lighting = 'dynamic party lighting with colorful ambiance and excitement energy';
    colorPalette = 'festive, celebratory colors with party atmosphere highlights';
    textPlacement = 'exciting event typography with celebration details';
    targetAudience = 'event attendees and entertainment enthusiasts';
  } else {
    // Intelligent generic enhancement with ContentFlow context
    primaryContext = 'professional social media advertisement photography';
    visualStyle = 'engaging visual composition optimized for social media engagement and brand storytelling';
    lighting = 'balanced commercial lighting perfect for social media visibility';
    colorPalette = 'brand-appropriate colors optimized for social media algorithms';
    textPlacement = 'social media optimized typography with engagement-driving elements';
    targetAudience = 'social media users and target demographic';
  }
  
  // Dynamic composition selection based on content
  const compositions = [
    'rule of thirds composition with strategic focal points',
    'centered hero composition with balanced visual hierarchy',
    'dynamic diagonal layout creating visual movement and energy',
    'minimalist composition with purposeful negative space',
    'layered composition with depth of field and visual storytelling'
  ];
  composition = compositions[Math.floor(Math.random() * compositions.length)];
  
  // ContentFlow-specific enhancement
  const contentFlowElements = [
    'optimized for Instagram and Facebook advertising algorithms',
    'designed for maximum social media engagement and shares',
    'crafted for influencer marketing and brand partnerships',
    'tailored for event promotion and audience conversion',
    'engineered for viral social media content creation'
  ];
  const contentFlowElement = contentFlowElements[Math.floor(Math.random() * contentFlowElements.length)];
  
  // Create comprehensive enhanced prompt
  return `${primaryContext} featuring ${prompt}, ${visualStyle}, ${composition}, ${lighting}, ${colorPalette}, ${textPlacement}, targeting ${targetAudience}, ${contentFlowElement}, ultra-high resolution with crisp commercial-grade details, professional brand appeal with exceptional visual hierarchy and marketing psychology, social media optimized dimensions and engagement-focused design elements`;
}

// Enhance prompt using Gemini AI for better ad generation
exports.enhancePrompt = async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required for enhancement'
      });
    }

    console.log('Enhancing prompt with Gemini AI:', prompt);

    // Enhanced prompt for ContentFlow system specifically for advertisement generation
    const enhancementPrompt = `You are an expert marketing and advertising professional. I need you to enhance the following basic prompt into a detailed, compelling advertisement description for AI image generation.

Original prompt: "${prompt}"

Please enhance this into a professional advertisement description that includes:

1. **Visual Composition**: Specific layout, composition style (centered, dynamic, minimalist, etc.)
2. **Photography Style**: High-quality photography type (professional, commercial, lifestyle, product photography)
3. **Color Scheme**: Appropriate colors that work for advertising (vibrant, professional, brand-appropriate)
4. **Lighting**: Studio lighting, natural light, dramatic lighting, etc.
5. **Text Elements**: Where text should appear, font style suggestions
6. **Brand Appeal**: Commercial appeal, target audience consideration
7. **Technical Quality**: High resolution, crisp details, professional finish

For ContentFlow system context:
- This is for influencers, businesses, and event organizers
- Should work for social media advertising (Instagram, Facebook, etc.)
- Must be visually striking and engagement-focused
- Should be professional yet approachable

Return ONLY the enhanced prompt in 2-3 detailed sentences, no explanations or additional text:`;

    try {
      console.log('🤖 Using Gemini API for prompt enhancement...');
      console.log('Gemini API Key available:', !!process.env.GEMINI_API_KEY);
      
      // Using Google Gemini API for prompt enhancement
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancementPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
          }
        })
      });

      if (geminiResponse.ok) {
        const geminiResult = await geminiResponse.json();
        console.log('✅ Gemini API response received');
        console.log('Gemini result structure:', JSON.stringify(geminiResult, null, 2));
        
        const enhancedPrompt = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (enhancedPrompt) {
          console.log('✅ Prompt enhanced successfully with Gemini AI');
          console.log('Enhanced prompt:', enhancedPrompt);
          return res.json({
            success: true,
            enhancedPrompt: enhancedPrompt,
            originalPrompt: prompt
          });
        } else {
          console.log('❌ No enhanced text found in Gemini response');
        }
      } else {
        const errorText = await geminiResponse.text();
        console.log(`❌ Gemini API failed with status ${geminiResponse.status}: ${errorText}`);
      }

      // Smart context-aware fallback enhancement
      console.log('Gemini API failed, using smart fallback enhancement');
      const fallbackEnhanced = createContextAwareEnhancement(prompt);
      
      return res.json({
        success: true,
        enhancedPrompt: fallbackEnhanced,
        originalPrompt: prompt,
        note: 'Enhanced using intelligent fallback system'
      });

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError.message);
      
      // Smart context-aware fallback enhancement
      const fallbackEnhanced = createContextAwareEnhancement(prompt);
      
      return res.json({
        success: true,
        enhancedPrompt: fallbackEnhanced,
        originalPrompt: prompt,
        note: 'Enhanced using intelligent fallback system due to API error'
      });
    }

  } catch (error) {
    console.error('Prompt enhancement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enhance prompt',
      error: error.message
    });
  }
};

// Generate ad with AI models (DeepAI Primary, Black Forest Fallback)
exports.generateAd = async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const FormData = require('form-data');
    
    const { prompt, style, dimensions } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    console.log('Generating ad with DeepAI and Black Forest fallback...');
    console.log('Original prompt:', prompt);

    // Enhanced prompt for professional advertisement generation
    const enhancedPrompt = `${prompt}, professional commercial advertisement, high-quality photography, clean modern design, vibrant colors, marketing layout, studio lighting, commercial appeal, ${style || 'professional'} style, crisp details, advertising poster, brand-appropriate composition`;

    let imageBuffer = null;
    let successfulService = '';

    // AI Services in priority order: 1. DeepAI, 2. Black Forest FLUX
    const imageServices = [
      {
        name: 'DeAPI.ai Flux1schnell',
        type: 'deepai'
      },
      {
        name: 'Black Forest FLUX.1-dev',
        type: 'huggingface',
        url: 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev'
      },
      {
        name: 'Black Forest FLUX.1-schnell', 
        type: 'huggingface',
        url: 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell'
      }
    ];

    // Try each service in order
    for (const service of imageServices) {
      try {
        console.log(`Trying ${service.name}...`);

        if (service.type === 'deepai') {
          // DeAPI.ai API call with proper JSON format
          const deapiResponse = await fetch('https://api.deapi.ai/api/v1/client/txt2img', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DEEPAI_API_KEY}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: enhancedPrompt,
              negative_prompt: "blur, darkness, noise, low quality, distorted, ugly, bad anatomy, watermark, text, letters",
              model: "Flux1schnell",
              width: dimensions?.width || 512,
              height: dimensions?.height || 512,
              guidance: 7.5,
              steps: 8,
              seed: Math.floor(Math.random() * 1000000)
            })
          });

          if (deapiResponse.ok) {
            const deapiResult = await deapiResponse.json();
            console.log('DeAPI.ai response:', deapiResult);
            
            if (deapiResult.image_url || deapiResult.output_url || deapiResult.url) {
              // Download the generated image
              const imageUrl = deapiResult.image_url || deapiResult.output_url || deapiResult.url;
              const imageResponse = await fetch(imageUrl);
              if (imageResponse.ok) {
                imageBuffer = await imageResponse.buffer();
                successfulService = service.name;
                console.log(`✅ Successfully generated image with ${service.name}`);
                break;
              }
            } else if (deapiResult.data && typeof deapiResult.data === 'string') {
              // Handle base64 encoded response
              imageBuffer = Buffer.from(deapiResult.data, 'base64');
              successfulService = service.name;
              console.log(`✅ Successfully generated image with ${service.name} (base64)`);
              break;
            }
          } else {
            const errorText = await deapiResponse.text();
            console.log(`❌ DeAPI.ai failed with status ${deapiResponse.status}: ${errorText}`);
          }

        } else if (service.type === 'huggingface') {
          // Hugging Face API call
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          const hfResponse = await fetch(service.url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: enhancedPrompt,
              parameters: {
                guidance_scale: 7.5,
                num_inference_steps: service.name.includes('schnell') ? 4 : 20,
                width: dimensions?.width || 1024,
                height: dimensions?.height || 1024
              }
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (hfResponse.ok) {
            imageBuffer = await hfResponse.buffer();
            successfulService = service.name;
            console.log(`✅ Successfully generated image with ${service.name}`);
            break;
          } else {
            const errorText = await hfResponse.text();
            console.log(`❌ ${service.name} failed with status ${hfResponse.status}: ${errorText}`);
          }
        }

      } catch (serviceError) {
        console.log(`❌ ${service.name} failed:`, serviceError.message);
        continue;
      }
    }

    // If all AI services failed, return error
    if (!imageBuffer) {
      console.log('❌ All AI image generation services failed');
      return res.status(503).json({
        success: false,
        message: 'All AI image generation services are currently unavailable. Please try again later.',
        error: 'ALL_SERVICES_FAILED',
        details: {
          attempted: imageServices.map(s => s.name),
          suggestion: 'Try again in a few minutes. DeepAI or Black Forest services may be temporarily unavailable.'
        }
      });
    }
    
    console.log(`🎨 Image generated successfully with ${successfulService}, uploading to Cloudinary...`);

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

    console.log('✅ Upload successful:', uploadResult.secure_url);

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
      },
      generatedWith: successfulService
    });

    await generatedAd.save();
    console.log('💾 Generated ad saved to database');

    res.json({
      success: true,
      message: `Ad generated successfully with ${successfulService}`,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      prompt: enhancedPrompt,
      adId: generatedAd._id,
      generatedWith: successfulService
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