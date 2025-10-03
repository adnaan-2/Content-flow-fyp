// Frontend validation utilities for social media posting

export interface PostContent {
  caption?: string;
  mediaUrls?: string[];
  platforms: string[];
}

export interface ValidationError {
  platform: string;
  message: string;
}

// Platform requirements
const PLATFORM_REQUIREMENTS = {
  facebook: {
    requiresContent: true, // Either text or media
    supportsText: true,
    supportsMedia: true,
    maxTextLength: 63206, // Facebook's limit
    mediaRequired: false,
    textRequired: false
  },
  instagram: {
    requiresContent: true,
    supportsText: true,
    supportsMedia: true,
    maxTextLength: 2200,
    mediaRequired: true, // Instagram requires at least one image
    textRequired: false
  },
  x: {
    requiresContent: true,
    supportsText: true,
    supportsMedia: true, // X supports media but it's optional
    maxTextLength: 280,
    mediaRequired: false,
    textRequired: true // X requires text content
  },
  twitter: {
    requiresContent: true,
    supportsText: true,
    supportsMedia: true, // X supports media but it's optional
    maxTextLength: 280,
    mediaRequired: false,
    textRequired: true
  },
  linkedin: {
    requiresContent: true,
    supportsText: true,
    supportsMedia: true,
    maxTextLength: 3000,
    mediaRequired: false,
    textRequired: false
  }
};

/**
 * Validate post content for selected platforms
 */
export const validatePostContent = (content: PostContent): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!content.platforms || content.platforms.length === 0) {
    errors.push({
      platform: 'general',
      message: 'Please select at least one platform'
    });
    return errors;
  }

  const hasText = content.caption && content.caption.trim().length > 0;
  const hasMedia = content.mediaUrls && content.mediaUrls.length > 0;

  for (const platform of content.platforms) {
    const requirements = PLATFORM_REQUIREMENTS[platform as keyof typeof PLATFORM_REQUIREMENTS];
    
    if (!requirements) {
      errors.push({
        platform,
        message: 'Unsupported platform'
      });
      continue;
    }

    // Check if content is required
    if (requirements.requiresContent && !hasText && !hasMedia) {
      errors.push({
        platform,
        message: 'Requires either text or media content'
      });
      continue;
    }

    // Check if text is required
    if (requirements.textRequired && !hasText) {
      errors.push({
        platform,
        message: 'Text content is required'
      });
      continue;
    }

    // Check if media is required
    if (requirements.mediaRequired && !hasMedia) {
      errors.push({
        platform,
        message: 'At least one image is required'
      });
      continue;
    }

    // Check text length limits
    if (hasText && content.caption && content.caption.length > requirements.maxTextLength) {
      errors.push({
        platform,
        message: `Text exceeds ${requirements.maxTextLength} character limit (current: ${content.caption.length})`
      });
    }

    // Platform-specific validations
    switch (platform) {
      case 'instagram':
        if (!hasMedia) {
          errors.push({
            platform,
            message: 'Instagram requires at least one image'
          });
        }
        break;
        
      case 'x':
      case 'twitter':
        if (!hasText) {
          errors.push({
            platform,
            message: 'Text content is required for X/Twitter'
          });
        }
        // Note: Media is optional for X/Twitter - text-only posts are allowed
        break;
    }
  }

  return errors;
};

/**
 * Get character count and limit for a platform
 */
export const getCharacterInfo = (platform: string, text: string) => {
  const requirements = PLATFORM_REQUIREMENTS[platform as keyof typeof PLATFORM_REQUIREMENTS];
  
  if (!requirements) {
    return { count: text.length, limit: null, isValid: true };
  }

  const count = text.length;
  const limit = requirements.maxTextLength;
  const isValid = count <= limit;

  return { count, limit, isValid };
};

/**
 * Check if a platform supports certain content types
 */
export const getPlatformCapabilities = (platform: string) => {
  const requirements = PLATFORM_REQUIREMENTS[platform as keyof typeof PLATFORM_REQUIREMENTS];
  
  if (!requirements) {
    return {
      supportsText: false,
      supportsMedia: false,
      textRequired: false,
      mediaRequired: false
    };
  }

  return {
    supportsText: requirements.supportsText,
    supportsMedia: requirements.supportsMedia,
    textRequired: requirements.textRequired || false,
    mediaRequired: requirements.mediaRequired
  };
};

/**
 * Get platform-specific posting tips
 */
export const getPlatformTips = (platform: string): string[] => {
  const tips: { [key: string]: string[] } = {
    facebook: [
      'Supports text, images, or both',
      'Character limit: 63,206 characters',
      'Can post to specific Facebook pages'
    ],
    instagram: [
      'Requires at least one image',
      'Character limit: 2,200 characters',
      'Uses Instagram Business account connected to Facebook',
      'May take 30-60 seconds to process media before posting'
    ],
    x: [
      'Text content is required',
      'Character limit: 280 characters',
      'Media posting requires additional setup'
    ],
    twitter: [
      'Text content is required',
      'Character limit: 280 characters',
      'Media posting requires additional setup'
    ],
    linkedin: [
      'Supports text, images, or both',
      'Character limit: 3,000 characters',
      'Posts to your personal LinkedIn profile'
    ]
  };

  return tips[platform] || ['No specific tips available'];
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  
  return errors.map(error => {
    if (error.platform === 'general') {
      return error.message;
    }
    return `${error.platform}: ${error.message}`;
  }).join('\n');
};

/**
 * Check if posting is allowed based on validation
 */
export const canPost = (content: PostContent): boolean => {
  const errors = validatePostContent(content);
  return errors.length === 0;
};