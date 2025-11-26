const Post = require('../models/Post');
const SocialAccount = require('../models/SocialAccount');
const User = require('../models/User');
const notificationService = require('../utils/notificationService');
const axios = require('axios');

// Helper function to check Instagram media container status
const checkInstagramMediaStatus = async (igUserId, creationId, accessToken) => {
  try {
    const { baseUrl } = SOCIAL_MEDIA_APIS.instagram;
    const statusUrl = `${baseUrl}/${creationId}?fields=status_code&access_token=${accessToken}`;
    
    const response = await axios.get(statusUrl);
    const statusCode = response.data.status_code;
    
    // Status codes: IN_PROGRESS, FINISHED, ERROR
    return {
      isReady: statusCode === 'FINISHED',
      status: statusCode,
      hasError: statusCode === 'ERROR'
    };
  } catch (error) {
    console.log('Could not check media status:', error.response?.data);
    return { isReady: false, status: 'UNKNOWN', hasError: false };
  }
};

// Helper function to validate Instagram image requirements
const validateInstagramImage = async (imageUrl) => {
  try {
    console.log('Validating Instagram image:', imageUrl);
    
    // Get image metadata
    const response = await axios.head(imageUrl, { timeout: 10000 });
    const contentType = response.headers['content-type'];
    const contentLength = parseInt(response.headers['content-length'] || '0');
    
    // Check file format
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!supportedFormats.includes(contentType)) {
      throw new Error(`Unsupported format: ${contentType}. Instagram supports JPEG and PNG only.`);
    }
    
    // Check file size (Instagram limit: 8MB)
    const maxSize = 8 * 1024 * 1024; // 8MB in bytes
    if (contentLength > maxSize) {
      throw new Error(`Image too large: ${(contentLength / 1024 / 1024).toFixed(1)}MB. Instagram limit is 8MB.`);
    }
    
    if (contentLength === 0) {
      console.warn('Could not determine image size, proceeding with upload');
    }
    
    console.log(`Image validation passed: ${contentType}, ${(contentLength / 1024).toFixed(1)}KB`);
    return { valid: true, contentType, size: contentLength };
    
  } catch (error) {
    console.error('Image validation error:', error.message);
    throw new Error(`Image validation failed: ${error.message}`);
  }
};

// Helper function to check Instagram media with detailed error info
const checkInstagramMediaStatusDetailed = async (igUserId, creationId, accessToken) => {
  try {
    const { baseUrl } = SOCIAL_MEDIA_APIS.instagram;
    const statusUrl = `${baseUrl}/${creationId}?fields=status_code,status&access_token=${accessToken}`;
    
    const response = await axios.get(statusUrl);
    const data = response.data;
    
    console.log('Instagram media status response:', data);
    
    return {
      isReady: data.status_code === 'FINISHED',
      status: data.status_code,
      statusMessage: data.status,
      hasError: data.status_code === 'ERROR',
      details: data
    };
  } catch (error) {
    console.log('Could not check detailed media status:', error.response?.data);
    return { 
      isReady: false, 
      status: 'UNKNOWN', 
      hasError: false,
      details: null
    };
  }
};

// Social Media API endpoints and configurations
const SOCIAL_MEDIA_APIS = {
  facebook: {
    baseUrl: 'https://graph.facebook.com/v18.0',
    postEndpoint: (pageId) => `/${pageId}/photos`, // For photo posts
    textEndpoint: (pageId) => `/${pageId}/feed`, // For text posts
  },
  instagram: {
    baseUrl: 'https://graph.facebook.com/v18.0',
    mediaEndpoint: (igUserId) => `/${igUserId}/media`,
    publishEndpoint: (igUserId) => `/${igUserId}/media_publish`,
  },
  x: {
    baseUrl: 'https://api.twitter.com/2',
    postEndpoint: '/tweets',
  },
  linkedin: {
    baseUrl: 'https://api.linkedin.com/v2',
    postEndpoint: '/ugcPosts',
    mediaEndpoint: '/assets?action=registerUpload',
  }
};

// Helper function to get social account
const getSocialAccount = async (userId, platform, accountId = null) => {
  try {
    const query = {
      userId,
      platform,
      isActive: true
    };
    
    if (accountId) {
      query.accountId = accountId;
    }
    
    const account = await SocialAccount.findOne(query);
    return account;
  } catch (error) {
    console.error('Error fetching social account:', error);
    throw new Error('Failed to fetch social account');
  }
};

// Helper function to validate Instagram account setup
const validateInstagramAccount = async (account) => {
  try {
    const igUserId = account.platformData?.instagramBusinessId || account.accountId;
    const accessToken = account.accessToken;
    
    if (!igUserId) {
      throw new Error('Instagram Business ID not found. Please reconnect your Instagram account.');
    }
    
    if (!accessToken) {
      throw new Error('Instagram access token not found. Please reconnect your Instagram account.');
    }
    
    // Test the account by making a simple API call
    const { baseUrl } = SOCIAL_MEDIA_APIS.instagram;
    const testUrl = `${baseUrl}/${igUserId}?fields=id,username&access_token=${accessToken}`;
    
    console.log('Testing Instagram account access...');
    const response = await axios.get(testUrl, { timeout: 10000 });
    
    console.log('Instagram account verified:', response.data);
    return { valid: true, accountInfo: response.data };
    
  } catch (error) {
    console.error('Instagram account validation failed:', error.response?.data || error.message);
    throw new Error(`Instagram account validation failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Validate content for platform-specific requirements
const validateContentForPlatform = (platform, content) => {
  const errors = [];

  switch (platform) {
    case 'instagram':
      if (!content.mediaUrls || content.mediaUrls.length === 0) {
        errors.push('Instagram requires at least one image');
      }
      if (content.mediaUrls && content.mediaUrls.length > 1) {
        errors.push('Instagram currently supports single image posts only');
      }
      break;
    
    case 'x':
    case 'twitter':
      if (!content.text || content.text.trim() === '') {
        errors.push('X/Twitter requires text content');
      }
      if (content.text && content.text.length > 280) {
        errors.push('X/Twitter text exceeds 280 character limit');
      }
      break;
    
    case 'facebook':
      if (!content.text && (!content.mediaUrls || content.mediaUrls.length === 0)) {
        errors.push('Facebook requires either text or media content');
      }
      break;
    
    case 'linkedin':
      if (!content.text && (!content.mediaUrls || content.mediaUrls.length === 0)) {
        errors.push('LinkedIn requires either text or media content');
      }
      break;
  }

  return errors;
};

// Facebook posting functions
const postToFacebook = async (account, content, pageId = null) => {
  try {
    let accessToken, targetPageId;
    
    if (pageId) {
      // Posting to a specific Facebook page
      const page = account.getFacebookPageById(pageId);
      if (!page) {
        throw new Error('Facebook page not found');
      }
      accessToken = page.accessToken;
      targetPageId = pageId;
    } else {
      // Posting to main account or first available page
      const pages = account.getFacebookPages();
      if (pages.length > 0) {
        accessToken = pages[0].accessToken;
        targetPageId = pages[0].id;
      } else {
        accessToken = account.accessToken;
        targetPageId = account.accountId;
      }
    }

    const { baseUrl } = SOCIAL_MEDIA_APIS.facebook;
    let endpoint, postData;

    if (content.mediaUrls && content.mediaUrls.length > 0) {
      // Photo post - check if it's multiple images for carousel
      if (content.mediaUrls.length > 1) {
        // Multiple images - use batch upload (simplified version)
        endpoint = `${baseUrl}${SOCIAL_MEDIA_APIS.facebook.textEndpoint(targetPageId)}`;
        postData = {
          message: content.text || '',
          attached_media: content.mediaUrls.map((url, index) => ({
            media_fbid: `temp_${index}` // In real implementation, you'd upload each image first
          })),
          access_token: accessToken
        };
      } else {
        // Single photo post
        endpoint = `${baseUrl}${SOCIAL_MEDIA_APIS.facebook.postEndpoint(targetPageId)}`;
        postData = {
          url: content.mediaUrls[0], // Facebook Graph API can post from URL
          caption: content.text || '',
          access_token: accessToken
        };
      }
    } else {
      // Text post
      endpoint = `${baseUrl}${SOCIAL_MEDIA_APIS.facebook.textEndpoint(targetPageId)}`;
      postData = {
        message: content.text,
        access_token: accessToken
      };
    }

    const response = await axios.post(endpoint, postData);
    return response.data.id || response.data.post_id;
  } catch (error) {
    console.error('Facebook posting error:', error.response?.data || error.message);
    throw new Error(`Facebook posting failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Instagram posting functions
const postToInstagram = async (account, content) => {
  try {
    const { baseUrl } = SOCIAL_MEDIA_APIS.instagram;
    const igUserId = account.platformData?.instagramBusinessId || account.accountId;
    const accessToken = account.accessToken;

    console.log('Instagram posting - Account ID:', igUserId);
    console.log('Instagram posting - Access token exists:', !!accessToken);

    if (!content.mediaUrls || content.mediaUrls.length === 0) {
      throw new Error('Instagram requires media content');
    }

    // Step 0: Validate Instagram account setup
    console.log('Validating Instagram account setup...');
    try {
      const accountValidation = await validateInstagramAccount(account);
      console.log('Instagram account validated:', accountValidation.accountInfo.username);
    } catch (validationError) {
      throw new Error(`Account validation failed: ${validationError.message}`);
    }

    // Step 1: Validate image before uploading
    console.log('Validating Instagram image requirements...');
    try {
      await validateInstagramImage(content.mediaUrls[0]);
    } catch (validationError) {
      throw new Error(`Image validation failed: ${validationError.message}`);
    }

    // Step 1: Create media container with proper parameters
    const mediaEndpoint = `${baseUrl}${SOCIAL_MEDIA_APIS.instagram.mediaEndpoint(igUserId)}`;
    
    // Prepare media data with all required fields
    const mediaData = {
      image_url: content.mediaUrls[0],
      caption: content.text || '',
      media_type: 'IMAGE', // Explicitly specify media type
      access_token: accessToken
    };

    console.log('Creating Instagram media container with data:', {
      image_url: content.mediaUrls[0],
      caption: content.text?.substring(0, 50) + '...',
      media_type: 'IMAGE',
      endpoint: mediaEndpoint
    });

    const mediaResponse = await axios.post(mediaEndpoint, mediaData, {
      timeout: 30000 // 30 second timeout
    });
    
    const creationId = mediaResponse.data.id;
    console.log('Media container created successfully:', creationId);

    // Step 2: Wait and retry publishing (Instagram needs time to process media)
    const publishEndpoint = `${baseUrl}${SOCIAL_MEDIA_APIS.instagram.publishEndpoint(igUserId)}`;
    const publishData = {
      creation_id: creationId,
      access_token: accessToken
    };

    // Step 3: Check media status and retry publishing with smart waiting
    const maxRetries = 8;
    let retryDelay = 3000; // Start with 3 seconds
    let statusCheckDelay = 2000; // Initial status check delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Instagram publish attempt ${attempt}/${maxRetries}...`);
        
        // Wait before checking status/publishing
        if (attempt > 1) {
          console.log(`Waiting ${statusCheckDelay}ms before status check...`);
          await new Promise(resolve => setTimeout(resolve, statusCheckDelay));
        }

        // Check media status first with detailed info
        const mediaStatus = await checkInstagramMediaStatusDetailed(igUserId, creationId, accessToken);
        console.log(`Media status: ${mediaStatus.status}, Ready: ${mediaStatus.isReady}`);
        console.log('Status details:', mediaStatus.details);

        if (mediaStatus.hasError) {
          const errorMsg = mediaStatus.statusMessage || 'Instagram media processing failed';
          console.error('Instagram media error:', errorMsg);
          throw new Error(`Instagram media processing failed: ${errorMsg}`);
        }

        if (!mediaStatus.isReady && mediaStatus.status === 'IN_PROGRESS') {
          console.log('Media still processing, waiting longer...');
          
          if (attempt === maxRetries) {
            throw new Error('Instagram media took too long to process. Please try again later.');
          }
          
          // Increase delay for media processing
          statusCheckDelay = Math.min(statusCheckDelay * 1.2, 8000);
          continue;
        }

        // Attempt to publish
        console.log('Attempting to publish Instagram post...');
        const publishResponse = await axios.post(publishEndpoint, publishData, {
          timeout: 20000 // 20 second timeout
        });
        
        const publishedId = publishResponse.data.id;
        console.log('✅ Instagram post published successfully!');
        console.log('Published post ID:', publishedId);
        console.log('Instagram URL: https://www.instagram.com/p/' + publishedId);
        
        return publishedId;

      } catch (publishError) {
        const errorData = publishError.response?.data?.error;
        
        // Check if it's a "media not ready" error
        if (errorData && (
          errorData.code === 9007 || 
          errorData.error_subcode === 2207027 ||
          errorData.message?.includes('Media ID is not available') ||
          errorData.message?.includes('not ready to be published') ||
          errorData.message?.includes('Please wait a moment')
        )) {
          console.log(`Media not ready (attempt ${attempt}), retrying...`);
          
          if (attempt === maxRetries) {
            throw new Error('Instagram media took too long to process. Try again in a few minutes.');
          }
          
          // Exponential backoff for media not ready errors
          statusCheckDelay = Math.min(statusCheckDelay * 1.5, 12000); // Cap at 12 seconds
          continue;
        } else {
          // Different error, don't retry
          console.error('Non-retryable Instagram error:', errorData);
          throw publishError;
        }
      }
    }

    throw new Error('Failed to publish after maximum retries');

  } catch (error) {
    console.error('Instagram posting error:', error.response?.data || error.message);
    throw new Error(`Instagram posting failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

// X (Twitter) posting functions
const postToX = async (account, content) => {
  try {
    const crypto = require('crypto');
    
    // X uses OAuth 1.0a authentication
    const oauthToken = account.accessToken;
    const oauthTokenSecret = account.refreshToken; // Token secret stored in refreshToken field

    console.log('🐦 X posting started...');
    console.log('X Account ID:', account.accountId);
    console.log('OAuth token exists:', !!oauthToken);
    console.log('OAuth token secret exists:', !!oauthTokenSecret);
    console.log('X API Key exists:', !!process.env.X_API_KEY);
    console.log('X API Secret exists:', !!process.env.X_API_SECRET);
    console.log('Text content:', content.text?.substring(0, 50) + '...');

    // Validate required credentials
    if (!oauthToken || !oauthTokenSecret) {
      throw new Error('X OAuth tokens missing. Please reconnect your X account.');
    }
    
    if (!process.env.X_API_KEY || !process.env.X_API_SECRET) {
      throw new Error('X API credentials not configured. Contact administrator.');
    }

    // X only supports text posts via basic API (media requires separate upload)
    if (!content.text || content.text.trim() === '') {
      throw new Error('X requires text content - cannot post empty message');
    }

    // Ensure text is within X's character limit
    const maxLength = 280;
    let tweetText = content.text.trim();
    if (tweetText.length > maxLength) {
      tweetText = tweetText.substring(0, maxLength - 3) + '...';
      console.log(`Text truncated to ${maxLength} characters`);
    }

    // Use X API v2 endpoint for posting
    const apiUrl = 'https://api.twitter.com/2/tweets';
    const postData = {
      text: tweetText
    };

    // Create OAuth 1.0a signature for X API v2
    const oauthParams = {
      oauth_consumer_key: process.env.X_API_KEY,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: oauthToken,
      oauth_version: '1.0'
    };

    // Create parameter string for signature (no body params for POST with JSON)
    const paramString = Object.keys(oauthParams)
      .sort()
      .map(key => `${key}=${encodeURIComponent(oauthParams[key])}`)
      .join('&');

    // Create signature base string
    const signatureBaseString = `POST&${encodeURIComponent(apiUrl)}&${encodeURIComponent(paramString)}`;
    
    // Create signing key
    const signingKey = `${encodeURIComponent(process.env.X_API_SECRET)}&${encodeURIComponent(oauthTokenSecret)}`;
    
    // Generate signature
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
    oauthParams.oauth_signature = signature;

    // Create authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    console.log('X API Request:', {
      url: apiUrl,
      textLength: tweetText.length,
      hasOAuthToken: !!oauthToken,
      hasConsumerKey: !!process.env.X_API_KEY
    });

    // Note: For media uploads on X, you would need to:
    // 1. Upload media first using /1.1/media/upload.json
    // 2. Get media_ids from upload response
    // 3. Include media_ids in the tweet creation
    if (content.mediaUrls && content.mediaUrls.length > 0) {
      console.warn('⚠️  X media posting not fully implemented - posting text only');
    }

    const response = await axios.post(apiUrl, postData, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15 second timeout
    });

    const tweetId = response.data.data.id;
    console.log('✅ X post published successfully!');
    console.log('Tweet ID:', tweetId);
    console.log('Tweet URL: https://twitter.com/i/web/status/' + tweetId);

    return tweetId;
  } catch (error) {
    console.error('❌ X posting error:', error.response?.data || error.message);
    
    // Handle specific X API errors
    if (error.response) {
      const errorData = error.response.data;
      const status = error.response.status;
      
      console.error('X API Error Details:', {
        status: status,
        data: errorData,
        headers: error.response.headers
      });

      // Common X API error messages
      if (status === 401) {
        throw new Error('X authentication failed. Please reconnect your X account.');
      } else if (status === 403) {
        throw new Error('X posting forbidden. Check account permissions and tweet content.');
      } else if (status === 429) {
        throw new Error('X rate limit exceeded. Please try again later.');
      } else if (errorData?.errors) {
        const errorMsg = errorData.errors.map(e => e.message).join(', ');
        throw new Error(`X posting failed: ${errorMsg}`);
      }
    }
    
    throw new Error(`X posting failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Helper function to upload media to LinkedIn
const uploadMediaToLinkedIn = async (accessToken, authorId, mediaUrl) => {
  try {
    console.log('📤 Uploading media to LinkedIn:', mediaUrl.substring(0, 50) + '...');
    
    // Step 1: Register upload with LinkedIn
    const registerUploadData = {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: authorId,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent'
        }]
      }
    };

    const registerResponse = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      registerUploadData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerResponse.data.value.asset;

    console.log('✅ LinkedIn upload registered, asset:', asset);

    // Step 2: Download image from Cloudinary
    const imageResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    console.log('📥 Downloaded image, size:', imageBuffer.length, 'bytes');

    // Step 3: Upload image to LinkedIn
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });

    console.log('✅ Media uploaded to LinkedIn successfully');
    return asset;

  } catch (error) {
    console.error('LinkedIn media upload error:', error.response?.data || error.message);
    throw new Error(`Failed to upload media to LinkedIn: ${error.message}`);
  }
};

// LinkedIn posting functions
const postToLinkedIn = async (account, content) => {
  try {
    const { baseUrl, postEndpoint } = SOCIAL_MEDIA_APIS.linkedin;
    const accessToken = account.accessToken;
    const authorId = `urn:li:person:${account.accountId}`;

    console.log('📝 LinkedIn posting started...');
    console.log('Author ID:', authorId);
    console.log('Has media:', !!(content.mediaUrls && content.mediaUrls.length > 0));

    let postData = {
      author: authorId,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.text || ''
          },
          shareMediaCategory: content.mediaUrls && content.mediaUrls.length > 0 ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Add media if available - upload to LinkedIn first
    if (content.mediaUrls && content.mediaUrls.length > 0) {
      try {
        const mediaAsset = await uploadMediaToLinkedIn(accessToken, authorId, content.mediaUrls[0]);
        
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: content.text || 'Shared image'
          },
          media: mediaAsset, // Use LinkedIn URN instead of direct URL
          title: {
            text: 'Shared Image'
          }
        }];
        
        console.log('✅ Media prepared for LinkedIn post');
      } catch (mediaError) {
        console.error('Media upload failed, posting text-only:', mediaError.message);
        // Fall back to text-only post
        postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'NONE';
      }
    }

    console.log('🚀 Posting to LinkedIn...');
    const response = await axios.post(`${baseUrl}${postEndpoint}`, postData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    console.log('✅ LinkedIn post successful!');
    return response.headers['x-linkedin-id'] || response.data.id;
  } catch (error) {
    console.error('LinkedIn posting error:', error.response?.data || error.message);
    
    // Extract more detailed error information
    let errorMessage = 'LinkedIn posting failed';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(`LinkedIn posting failed: ${errorMessage}`);
  }
};

// Helper function to generate platform URL
const generatePlatformUrl = (platform, postId, account) => {
  if (!postId || postId === 'scheduled' || postId === 'failed') return null;
  
  const platformData = account?.platformData || {};
  const accountName = account?.accountName;
  
  switch (platform.toLowerCase()) {
    case 'instagram':
      // Use account username for Instagram post URL
      const username = platformData.username || accountName;
      if (!username) return null;
      
      // If postId looks like a shortcode, use direct URL
      if (postId && !/^\d+$/.test(postId)) {
        return `https://www.instagram.com/p/${postId}/`;
      }
      // For numeric IDs or when we can't get shortcode, return profile URL
      return `https://www.instagram.com/${username}/`;
      
    case 'facebook':
      // Use page ID or user ID from platformData
      const fbUserId = platformData.id || platformData.userId;
      if (fbUserId && postId) {
        return `https://www.facebook.com/${fbUserId}/posts/${postId}`;
      }
      return `https://www.facebook.com/${postId}`;
      
    case 'x':
    case 'twitter':
      return `https://twitter.com/i/web/status/${postId}`;
      
    case 'linkedin':
      // Use proper LinkedIn post URL format
      if (postId.startsWith('urn:')) {
        return `https://www.linkedin.com/feed/update/${postId}`;
      }
      return `https://www.linkedin.com/feed/update/urn:li:activity:${postId}`;
      
    default:
      return null;
  }
};

// Main posting function
const postToSocialMedia = async (account, content, pageId = null) => {
  switch (account.platform) {
    case 'facebook':
      return await postToFacebook(account, content, pageId);
    case 'instagram':
      return await postToInstagram(account, content);
    case 'x':
      return await postToX(account, content);
    case 'linkedin':
      return await postToLinkedIn(account, content);
    default:
      throw new Error(`Unsupported platform: ${account.platform}`);
  }
};

// Post immediately to social media
const postNow = async (req, res) => {
  try {
    console.log('📝 PostNow called with:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.user?.id);
    
    const {
      caption,
      mediaUrls,
      platforms,
      mediaType = 'photo',
      facebookPageId = null
    } = req.body;

    const userId = req.user.id;
    const results = [];
    const errors = [];

    // Validate input
    if (!platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'No platforms selected' });
    }

    // Allow text-only posts for X (Twitter), but require content for other platforms
    const hasText = caption && caption.trim().length > 0;
    const hasMedia = mediaUrls && mediaUrls.length > 0;
    const isXOnly = platforms.length === 1 && (platforms[0] === 'x' || platforms[0] === 'twitter');

    if (!hasText && !hasMedia) {
      return res.status(400).json({ error: 'Either caption or media is required' });
    }

    // For X-only posts, only text is required
    if (isXOnly && !hasText) {
      return res.status(400).json({ error: 'X requires text content' });
    }

    // Process each platform
    for (const platform of platforms) {
      try {
        // Get social account for this platform
        console.log(`🔍 Looking for ${platform} account for user ${userId}`);
        const account = await getSocialAccount(userId, platform);
        if (!account) {
          console.log(`❌ No ${platform} account found for user ${userId}`);
          errors.push(`No connected ${platform} account found`);
          continue;
        }
        console.log(`✅ Found ${platform} account:`, account.accountId);

        // Prepare content
        const content = {
          text: caption,
          mediaUrls: mediaUrls || [],
          mediaType
        };

        // Validate content for platform
        const validationErrors = validateContentForPlatform(platform, content);
        if (validationErrors.length > 0) {
          console.log(`❌ Validation failed for ${platform}:`, validationErrors);
          errors.push(`${platform}: ${validationErrors.join(', ')}`);
          continue;
        }
        
        console.log(`✅ Validation passed for ${platform}`);
        console.log(`🔄 About to post to ${platform}...`);

        // Post to platform
        const postId = await postToSocialMedia(
          account, 
          content, 
          platform === 'facebook' ? facebookPageId : null
        );

        // Generate platform URL
        const platformUrl = generatePlatformUrl(platform, postId, account);

        // Save post record
        const post = new Post({
          userId,
          socialAccountId: account._id,
          platform,
          postId,
          platformUrl,
          content,
          publishedTime: new Date(),
          status: 'published',
          analytics: {
            likes: 0,
            comments: 0,
            shares: 0,
            views: 0,
            engagement: 0,
            reach: 0
          }
        });

        await post.save();
        console.log('Post saved to database:', post._id);
        results.push({
          platform,
          postId,
          status: 'published',
          publishedTime: post.publishedTime
        });

      } catch (error) {
        console.error(`Error posting to ${platform}:`, error);
        errors.push(`${platform}: ${error.message}`);
        
        // Save failed post record
        try {
          const account = await getSocialAccount(userId, platform);
          if (account) {
            const failedPost = new Post({
              userId,
              socialAccountId: account._id,
              platform,
              postId: 'failed',
              content: {
                text: caption,
                mediaUrls: mediaUrls || [],
                mediaType
              },
              facebookPageId: platform === 'facebook' ? facebookPageId : undefined,
              status: 'failed',
              errorMessage: error.message,
              publishedTime: new Date()
            });
            await failedPost.save();
          }
        } catch (saveError) {
          console.error('Error saving failed post:', saveError);
        }
      }
    }

    // Return results
    if (results.length === 0) {
      return res.status(400).json({
        error: 'Failed to post to any platform',
        details: errors
      });
    }

    // Send email notification for successful posts
    if (results.length > 0) {
      try {
        const user = await User.findById(userId);
        if (user) {
          const postDetails = {
            id: post._id,
            title: caption ? caption.substring(0, 50) : 'New Post',
            content: caption || 'Media post',
            platforms: results.map(r => r.platform)
          };
          await notificationService.sendPostPublishedNotification(userId, postDetails);
          console.log('� Post published notification sent to user:', userId);
        }
      } catch (notificationError) {
        console.error('� Post published notification error:', notificationError);
        // Don't fail the response if notification fails
      }
    }

    res.json({
      message: 'Posts processed',
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Post now error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Schedule a post
const schedulePost = async (req, res) => {
  try {
    const {
      caption,
      mediaUrls,
      platforms,
      scheduledTime,
      mediaType = 'photo',
      facebookPageId = null
    } = req.body;

    const userId = req.user.id;

    // Validate input
    if (!platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'No platforms selected' });
    }

    if (!caption && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({ error: 'Either caption or media is required' });
    }

    if (!scheduledTime) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const scheduledPosts = [];

    // Create scheduled post records for each platform
    for (const platform of platforms) {
      try {
        const account = await getSocialAccount(userId, platform);
        if (!account) {
          continue; // Skip if no account found
        }

        const scheduledPost = new Post({
          userId,
          socialAccountId: account._id,
          platform,
          postId: 'scheduled',
          content: {
            text: caption,
            mediaUrls: mediaUrls || [],
            mediaType
          },
          scheduledTime: scheduleDate,
          status: 'scheduled'
        });

        await scheduledPost.save();
        scheduledPosts.push(scheduledPost);

      } catch (error) {
        console.error(`Error creating scheduled post for ${platform}:`, error);
      }
    }

    if (scheduledPosts.length === 0) {
      return res.status(400).json({ error: 'No valid accounts found for selected platforms' });
    }

    // Schedule the job
    const jobId = `post_${Date.now()}_${userId}`;
    const job = schedule.scheduleJob(scheduleDate, async () => {
      console.log(`Executing scheduled post job: ${jobId}`);
      
      const publishedPlatforms = [];
      
      for (const post of scheduledPosts) {
        try {
          const account = await SocialAccount.findById(post.socialAccountId);
          if (!account || !account.isActive) {
            await Post.findByIdAndUpdate(post._id, { 
              status: 'failed',
              publishedTime: new Date()
            });
            continue;
          }

          // Post to platform
          const postId = await postToSocialMedia(
            account, 
            post.content, 
            platform === 'facebook' ? facebookPageId : null
          );

          // Update post record
          await Post.findByIdAndUpdate(post._id, {
            postId,
            status: 'published',
            publishedTime: new Date()
          });

          publishedPlatforms.push(post.platform);
          console.log(`Successfully posted scheduled content to ${post.platform}`);

        } catch (error) {
          console.error(`Error executing scheduled post for ${post.platform}:`, error);
          await Post.findByIdAndUpdate(post._id, { 
            status: 'failed',
            errorMessage: error.message,
            publishedTime: new Date()
          });
        }
      }

      // Send notification for published scheduled posts
      if (publishedPlatforms.length > 0) {
        try {
          const user = await User.findById(userId);
          if (user && scheduledPosts.length > 0) {
            const postDetails = {
              id: scheduledPosts[0]._id,
              title: scheduledPosts[0].content.text ? scheduledPosts[0].content.text.substring(0, 50) : 'Scheduled Post',
              content: scheduledPosts[0].content.text || 'Media post',
              platforms: publishedPlatforms
            };
            await notificationService.sendPostPublishedNotification(userId, postDetails);
            console.log('� Scheduled post published notification sent to user:', userId);
          }
        } catch (notificationError) {
          console.error('� Scheduled post published notification error:', notificationError);
        }
      }

      // Clean up job from memory
      scheduledJobs.delete(jobId);
    });

    // Store job reference
    scheduledJobs.set(jobId, {
      job,
      postIds: scheduledPosts.map(p => p._id),
      scheduledTime: scheduleDate
    });

    // Send email notification for post scheduling
    try {
      const user = await User.findById(userId);
      if (user) {
        const postDetails = {
          id: newPost._id,
          title: caption ? caption.substring(0, 50) : 'New Post',
          content: caption || 'Media post',
          scheduledTime: scheduleDate,
          platforms: platforms
        };
        await notificationService.sendPostScheduledNotification(userId, postDetails);
        console.log('� Post scheduled notification sent to user:', userId);
      }
    } catch (notificationError) {
      console.error('� Post scheduled notification error:', notificationError);
      // Don't fail the scheduling if notification fails
    }

    res.json({
      message: 'Posts scheduled successfully',
      jobId,
      scheduledTime: scheduleDate,
      postsCount: scheduledPosts.length,
      platforms: scheduledPosts.map(p => p.platform)
    });

  } catch (error) {
    console.error('Schedule post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's posts
const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      status = null, 
      platform = null 
    } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (platform) query.platform = platform;

    const posts = await Post.find(query)
      .populate('socialAccountId', 'platform accountName platformData')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findOne({ _id: postId, userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Test Instagram posting functionality
const testInstagramPosting = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrl, caption } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required for testing' });
    }

    // Get Instagram account
    const account = await getSocialAccount(userId, 'instagram');
    if (!account) {
      return res.status(404).json({ error: 'No Instagram account connected' });
    }

    console.log('🧪 Testing Instagram posting...');
    console.log('Image URL:', imageUrl);
    console.log('Caption:', caption?.substring(0, 50));

    // Test posting
    const content = {
      text: caption || 'Test post from Content Flow',
      mediaUrls: [imageUrl],
      mediaType: 'photo'
    };

    const postId = await postToInstagram(account, content);

    res.json({
      success: true,
      message: 'Instagram test post successful!',
      postId,
      instagramUrl: `https://www.instagram.com/p/${postId}`
    });

  } catch (error) {
    console.error('Instagram test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
};

// Test X posting functionality
const testXPosting = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text content is required for X posting' });
    }

    // Get X account
    const account = await getSocialAccount(userId, 'x');
    if (!account) {
      return res.status(404).json({ error: 'No X account connected' });
    }

    console.log('🧪 Testing X posting...');
    console.log('Account username:', account.platformData?.username || 'Unknown');
    console.log('Text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

    // Test posting
    const content = {
      text: text,
      mediaUrls: [],
      mediaType: 'text'
    };

    const tweetId = await postToX(account, content);

    res.json({
      success: true,
      message: 'X test post successful!',
      tweetId,
      twitterUrl: `https://twitter.com/i/web/status/${tweetId}`
    });

  } catch (error) {
    console.error('X test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
};

// Get scheduler status (for debugging)
const getSchedulerStatus = async (req, res) => {
  try {
    const schedulerInfo = {
      activeJobs: scheduledJobs.size,
      jobs: Array.from(scheduledJobs.entries()).map(([jobId, jobData]) => ({
        jobId,
        scheduledTime: jobData.scheduledTime,
        postCount: jobData.postIds.length
      })),
      upcomingPosts: await Post.countDocuments({
        status: 'scheduled',
        scheduledTime: { $gt: new Date() }
      })
    };

    res.json(schedulerInfo);
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Initialize scheduler on server start
const initializeScheduler = async () => {
  try {
    console.log('🔄 Initializing post scheduler...');
    
    // Restore scheduled posts from database
    const scheduledPosts = await Post.find({
      status: 'scheduled',
      scheduledTime: { $gt: new Date() }
    }).populate('socialAccountId');

    let restoredCount = 0;

    for (const post of scheduledPosts) {
      const jobId = `restored_${post._id}`;
      const job = schedule.scheduleJob(post.scheduledTime, async () => {
        console.log(`⏰ Executing scheduled post: ${post._id} for ${post.platform}`);
        
        try {
          const account = await SocialAccount.findById(post.socialAccountId);
          if (!account || !account.isActive) {
            console.log(`❌ Account not found or inactive for post ${post._id}`);
            await Post.findByIdAndUpdate(post._id, { 
              status: 'failed',
              errorMessage: 'Account not found or inactive',
              publishedTime: new Date()
            });
            return;
          }

          const postId = await postToSocialMedia(account, post.content);
          await Post.findByIdAndUpdate(post._id, {
            postId,
            status: 'published',
            publishedTime: new Date()
          });

          console.log(`✅ Successfully posted scheduled content ${post._id} to ${post.platform}`);

        } catch (error) {
          console.error(`❌ Error executing restored scheduled post ${post._id}:`, error);
          await Post.findByIdAndUpdate(post._id, { 
            status: 'failed',
            errorMessage: error.message,
            publishedTime: new Date()
          });
        }

        scheduledJobs.delete(jobId);
      });

      scheduledJobs.set(jobId, {
        job,
        postIds: [post._id],
        scheduledTime: post.scheduledTime
      });

      restoredCount++;
    }

    console.log(`✅ Post scheduler initialized - restored ${restoredCount} scheduled posts`);
  } catch (error) {
    console.error('❌ Error initializing scheduler:', error);
  }
};

module.exports = {
  postNow,
  getUserPosts,
  deletePost,
  postToSocialMedia,
  testInstagramPosting,
  testXPosting,
  getSocialAccount
};
