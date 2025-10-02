const express = require('express');
const router = express.Router();
const SocialAccount = require('../models/SocialAccount');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

// Meta (Facebook/Instagram) configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.BASE_URL + '/api/social-media/callback';

// General OAuth callback route (handles redirect from social platforms)
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, platform } = req.query;
    
    console.log('OAuth callback received:', { code: !!code, state, error, platform });
    
    if (error) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=no_code`);
    }
    
    // Determine platform from URL or state
    const detectedPlatform = platform || 'facebook'; // Default to facebook for now
    
    // Redirect to frontend with the code and platform info
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?code=${code}&state=${state}&platform=${detectedPlatform}`;
    console.log('Redirecting to frontend:', redirectUrl);
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=callback_error`);
  }
});

// Get all connected social accounts for user
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await SocialAccount.find({ 
      userId: req.user.id,
      isActive: true 
    });
    
    console.log(`Found ${accounts.length} accounts for user ${req.user.id}`);
    accounts.forEach(acc => {
      if (acc.platform === 'facebook') {
        console.log(`Facebook: ${acc.accountName} - Pages: ${acc.platformData?.pages?.length || 0}`);
      }
    });
    
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Facebook pages for a specific Facebook account
router.get('/accounts/:accountId/pages', authenticateToken, async (req, res) => {
  try {
    const account = await SocialAccount.findOne({
      _id: req.params.accountId,
      userId: req.user.id,
      platform: 'facebook',
      isActive: true
    });

    if (!account) {
      return res.status(404).json({ error: 'Facebook account not found' });
    }

    const pages = account.platformData?.pages || [];
    res.json({ 
      accountName: account.accountName,
      pages: pages
    });
  } catch (error) {
    console.error('Get Facebook pages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Facebook OAuth initiation - Updated to use backend callback
router.get('/auth/facebook', authenticateToken, async (req, res) => {
  try {
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement', 
      'pages_show_list',
      'pages_manage_metadata',
      'pages_read_user_content',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'business_management'
    ].join(',');

    // Use the backend callback URL - Facebook should redirect here first
    const backendRedirectUri = process.env.BASE_URL + '/api/social-media/callback/facebook';

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(backendRedirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `state=${req.user.id}`;

    console.log('Facebook Auth URL:', authUrl);
    console.log('Redirect URI:', backendRedirectUri);

    res.json({ authUrl });
  } catch (error) {
    console.error('Facebook auth initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add specific Facebook callback route
router.get('/callback/facebook', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    console.log('Facebook callback received:', { code: !!code, state, error });
    
    if (error) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=${encodeURIComponent(error)}&platform=facebook`);
    }
    
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=no_code&platform=facebook`);
    }
    
    // Redirect to frontend with the code and platform info
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?code=${code}&state=${state}&platform=facebook`;
    console.log('Redirecting to frontend:', redirectUrl);
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=callback_error&platform=facebook`);
  }
});

// Facebook OAuth callback - Clean and simple
router.post('/auth/facebook/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    console.log('🔗 Facebook OAuth - Starting authentication');
    
    const backendRedirectUri = process.env.BASE_URL + '/api/social-media/callback/facebook';

    // Step 1: Exchange code for access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: backendRedirectUri,
        code: code
      }
    });

    const { access_token } = tokenResponse.data;
    console.log('✅ Facebook access token received');

    // Step 2: Get Facebook user info
    const userResponse = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      params: {
        access_token: access_token,
        fields: 'id,name,email,picture'
      }
    });

    const facebookUser = userResponse.data;
    console.log('👤 Facebook user:', facebookUser.name);

    // Step 3: Get Facebook pages
    let pages = [];
    try {
      const pagesResponse = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
        params: {
          access_token: access_token,
          fields: 'id,name,access_token,picture,fan_count,instagram_business_account,category'
        }
      });

      pages = pagesResponse.data.data.map(page => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        profilePicture: page.picture?.data?.url,
        followerCount: page.fan_count || 0,
        category: page.category || 'Page',
        permissions: ['pages_manage_posts', 'pages_read_engagement'],
        isActive: true
      }));

      console.log(`📄 Found ${pages.length} Facebook pages`);
    } catch (pagesError) {
      console.error('⚠️  Error fetching Facebook pages:', pagesError.message);
    }

    // Step 4: Create or update Facebook account
    const existingAccount = await SocialAccount.findByPlatformAccountId(
      req.user.id, 
      'facebook', 
      facebookUser.id
    );

    let facebookAccount;
    const accountData = {
      userId: req.user.id,
      platform: 'facebook',
      accountId: facebookUser.id,
      accountName: facebookUser.name,
      email: facebookUser.email,
      profilePicture: facebookUser.picture?.data?.url,
      accessToken: access_token,
      permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
      platformData: {
        pages: pages,
        followerCount: 0,
        displayName: facebookUser.name
      },
      isActive: true
    };

    if (existingAccount) {
      facebookAccount = await SocialAccount.findByIdAndUpdate(
        existingAccount._id,
        accountData,
        { new: true }
      );
      console.log('🔄 Updated existing Facebook account');
    } else {
      facebookAccount = await SocialAccount.create(accountData);
      console.log('✨ Created new Facebook account');
    }

    // Step 5: Handle Instagram business accounts
    for (const page of pages) {
      if (page.instagram_business_account) {
        try {
          const instagramResponse = await axios.get(
            `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}`,
            {
              params: {
                access_token: page.accessToken,
                fields: 'id,username,profile_picture_url,followers_count,biography'
              }
            }
          );

          const instagramData = instagramResponse.data;
          
          // Check if Instagram account already exists
          const existingInstagram = await SocialAccount.findByPlatformAccountId(
            req.user.id,
            'instagram',
            instagramData.id
          );

          const instagramAccountData = {
            userId: req.user.id,
            platform: 'instagram',
            accountId: instagramData.id,
            accountName: instagramData.username,
            profilePicture: instagramData.profile_picture_url,
            accessToken: page.accessToken, // Use page token for Instagram API
            permissions: ['instagram_basic', 'instagram_content_publish'],
            platformData: {
              followerCount: instagramData.followers_count || 0,
              bio: instagramData.biography || '',
              displayName: instagramData.username,
              connectedFacebookPageId: page.id,
              instagramBusinessId: instagramData.id
            },
            isActive: true
          };

          if (existingInstagram) {
            await SocialAccount.findByIdAndUpdate(existingInstagram._id, instagramAccountData);
            console.log('🔄 Updated Instagram account:', instagramData.username);
          } else {
            await SocialAccount.create(instagramAccountData);
            console.log('✨ Created Instagram account:', instagramData.username);
          }

        } catch (instagramError) {
          console.error('⚠️  Error processing Instagram account:', instagramError.message);
        }
      }
    }

    // Step 6: Return all user's accounts
    const allAccounts = await SocialAccount.findUserAccounts(req.user.id);

    res.json({ 
      success: true, 
      message: `Facebook connected with ${pages.length} pages`,
      accounts: allAccounts
    });

  } catch (error) {
    console.error('❌ Facebook auth error:', error.response?.data || error.message);
    
    let errorMessage = 'Facebook authentication failed';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data || error.message
    });
  }
});

// LinkedIn OAuth initiation
router.get('/auth/linkedin', authenticateToken, async (req, res) => {
  try {
    if (!process.env.LINKEDIN_CLIENT_ID) {
      return res.status(500).json({ error: 'LinkedIn client ID not configured' });
    }

    // Only use the scopes you have access to
    const scopes = [
      'openid',
      'profile', 
      'email',
      'w_member_social'
    ].join('%20');

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI + '?platform=linkedin')}&` +
      `state=${req.user.id}&` +
      `scope=${scopes}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('LinkedIn auth initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// LinkedIn OAuth callback (fixed version)
router.post('/auth/linkedin/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    console.log('LinkedIn OAuth - Starting token exchange');

    console.log('🔗 LinkedIn OAuth - Starting authentication');

    // Exchange code for access token
    const tokenData = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI + '?platform=linkedin',
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET.trim() // Remove any whitespace
    };

    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      new URLSearchParams(tokenData).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    const { access_token } = tokenResponse.data;
    console.log('LinkedIn access token received');

    // Get user profile using userinfo endpoint
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const profile = profileResponse.data;
    console.log('LinkedIn profile retrieved:', profile.name);

    // Create or update LinkedIn account
    const existingAccount = await SocialAccount.findByPlatformAccountId(
      req.user.id,
      'linkedin',
      profile.sub
    );

    const accountData = {
      userId: req.user.id,
      platform: 'linkedin',
      accountId: profile.sub,
      accountName: profile.name,
      email: profile.email,
      profilePicture: profile.picture,
      accessToken: access_token,
      permissions: ['openid', 'profile', 'email', 'w_member_social'],
      platformData: {
        followerCount: 0,
        bio: profile.name,
        displayName: profile.name,
        linkedinId: profile.sub
      },
      isActive: true
    };

    let savedAccount;
    if (existingAccount) {
      savedAccount = await SocialAccount.findByIdAndUpdate(existingAccount._id, accountData, { new: true });
      console.log('🔄 Updated existing LinkedIn account');
    } else {
      savedAccount = await SocialAccount.create(accountData);
      console.log('✨ Created new LinkedIn account');
    }

    console.log('LinkedIn account saved to database:', savedAccount._id);

    res.json({ 
      success: true, 
      message: 'LinkedIn account connected successfully',
      account: {
        _id: savedAccount._id,
        platform: savedAccount.platform,
        accountName: savedAccount.accountName,
        platformData: savedAccount.platformData,
        isActive: savedAccount.isActive
      }
    });

  } catch (error) {
    console.error('LinkedIn auth error:', error.response?.data || error.message);
    
    // Provide more specific error messages
    let errorMessage = 'LinkedIn authentication failed';
    if (error.response?.data?.error === 'invalid_client') {
      errorMessage = 'Invalid LinkedIn app credentials. Please check your client ID and secret.';
    } else if (error.response?.data?.error === 'invalid_grant') {
      errorMessage = 'Authorization code expired or invalid. Please try connecting again.';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data || error.message
    });
  }
});

// X (Twitter) OAuth initiation - Using OAuth 1.0a (more reliable)
router.get('/auth/x', authenticateToken, async (req, res) => {
  try {
    if (!process.env.X_API_KEY || !process.env.X_API_SECRET) {
      return res.status(500).json({ error: 'X API credentials not configured' });
    }

    const crypto = require('crypto');
    
    // OAuth 1.0a Step 1: Get request token
    // Use 'oob' (out-of-band) as fallback if callback URL is not approved
    const oauthCallback = process.env.BASE_URL + '/api/social-media/callback/x';


    
    // Generate OAuth 1.0a parameters
    const oauthParams = {
      oauth_callback: oauthCallback,
      oauth_consumer_key: process.env.X_API_KEY,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0'
    };

    // Create signature base string
    const paramString = Object.keys(oauthParams)
      .sort()
      .map(key => `${key}=${encodeURIComponent(oauthParams[key])}`)
      .join('&');
    
    const signatureBaseString = `POST&${encodeURIComponent('https://api.twitter.com/oauth/request_token')}&${encodeURIComponent(paramString)}`;
    
    // Create signing key
    const signingKey = `${encodeURIComponent(process.env.X_API_SECRET)}&`;
    
    // Generate signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');
    
    oauthParams.oauth_signature = signature;

    // Create authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    // Request token from Twitter
    const requestTokenResponse = await axios.post('https://api.twitter.com/oauth/request_token', null, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const params = new URLSearchParams(requestTokenResponse.data);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');

    if (!oauthToken) {
      throw new Error('Failed to get request token');
    }

    // Store token secret for later use (with additional mapping)
    global.xTokenSecrets = global.xTokenSecrets || {};
    global.xTokenSecrets[req.user.id] = oauthTokenSecret;
    // Also store by oauth_token as backup
    global.xTokenSecrets[oauthToken] = oauthTokenSecret;

    console.log('Storing token secret for user:', req.user.id);
    console.log('Token secret stored:', !!oauthTokenSecret);
    console.log('Request token:', oauthToken);

    // Create authorization URL
    const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}&force_login=true`;



    res.json({ authUrl });
  } catch (error) {
    console.error('X auth initiation error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// X (Twitter) OAuth callback
router.get('/callback/x', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier, denied } = req.query;
    
    console.log('X callback received:', { 
      oauth_token: !!oauth_token, 
      oauth_verifier: !!oauth_verifier, 
      denied: denied
    });
    
    if (denied) {
  
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=access_denied&platform=x`);
    }
    
    if (!oauth_token || !oauth_verifier) {
  
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=missing_params&platform=x`);
    }
    
    // Redirect to frontend with the OAuth 1.0a parameters
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}&platform=x`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('X OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=callback_error&platform=x`);
  }
});

// X (Twitter) OAuth callback processing - OAuth 1.0a
router.post('/auth/x/callback', authenticateToken, async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.body;
    
    console.log('X OAuth - Processing callback for user');
    
    if (!oauth_token || !oauth_verifier) {
      console.error('Missing OAuth parameters in callback processing');
      return res.status(400).json({ error: 'OAuth token and verifier are required' });
    }



    // Retrieve stored token secret
    global.xTokenSecrets = global.xTokenSecrets || {};
    let oauthTokenSecret = global.xTokenSecrets[req.user.id];
    
    // Fallback: try to find by oauth_token
    if (!oauthTokenSecret) {
      oauthTokenSecret = global.xTokenSecrets[oauth_token];
    }
    
    console.log('Stored token secrets keys:', Object.keys(global.xTokenSecrets));
    console.log('Looking for user ID:', req.user.id);
    console.log('Looking for oauth_token:', oauth_token);
    console.log('Found token secret:', !!oauthTokenSecret);
    
    if (!oauthTokenSecret) {
      console.error('Token secret not found for user:', req.user.id, 'or oauth_token:', oauth_token);
      return res.status(400).json({ error: 'Token secret not found. Please restart the OAuth flow.' });
    }

    // We'll check if X account exists after getting user data

    const crypto = require('crypto');

    // OAuth 1.0a Step 3: Exchange for access token
    const oauthParams = {
      oauth_consumer_key: process.env.X_API_KEY,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
      oauth_version: '1.0'
    };

    // Create signature base string
    const paramString = Object.keys(oauthParams)
      .sort()
      .map(key => `${key}=${encodeURIComponent(oauthParams[key])}`)
      .join('&');
    
    const signatureBaseString = `POST&${encodeURIComponent('https://api.twitter.com/oauth/access_token')}&${encodeURIComponent(paramString)}`;
    
    // Create signing key (includes token secret this time)
    const signingKey = `${encodeURIComponent(process.env.X_API_SECRET)}&${encodeURIComponent(oauthTokenSecret)}`;
    
    // Generate signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');
    
    oauthParams.oauth_signature = signature;

    console.log('OAuth parameters for access token:', {
      oauth_consumer_key: oauthParams.oauth_consumer_key,
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
      signature_base: signatureBaseString.substring(0, 100) + '...',
      signing_key: signingKey.substring(0, 20) + '...'
    });

    // Create authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    console.log('Authorization header:', authHeader.substring(0, 100) + '...');

    // Get access token
    const accessTokenResponse = await axios.post('https://api.twitter.com/oauth/access_token', null, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessParams = new URLSearchParams(accessTokenResponse.data);
    const xAccessToken = accessParams.get('oauth_token');
    const xAccessTokenSecret = accessParams.get('oauth_token_secret');
    const screen_name = accessParams.get('screen_name');
    const user_id = accessParams.get('user_id');

    // Clean up the token secret
    delete global.xTokenSecrets[req.user.id];

    console.log('X access token received for user:', screen_name);

    // For OAuth 1.0a, we use the v1.1 API to get user info
    // Note: The API call includes query parameters, so we need to include them in signature
    const apiUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json';
    const queryParams = 'include_email=true';
    
    const userInfoParams = {
      include_email: 'true', // Include query parameter in OAuth signature
      oauth_consumer_key: process.env.X_API_KEY,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: xAccessToken,
      oauth_version: '1.0'
    };

    console.log('Creating user info signature with params:', {
      oauth_consumer_key: userInfoParams.oauth_consumer_key,
      oauth_token: userInfoParams.oauth_token,
      timestamp: userInfoParams.oauth_timestamp
    });

    // Create signature for user info request (MUST include query parameters)
    const userInfoParamString = Object.keys(userInfoParams)
      .sort()
      .map(key => `${key}=${encodeURIComponent(userInfoParams[key])}`)
      .join('&');
    
    const userInfoSignatureBase = `GET&${encodeURIComponent(apiUrl)}&${encodeURIComponent(userInfoParamString)}`;
    const userInfoSigningKey = `${encodeURIComponent(process.env.X_API_SECRET)}&${encodeURIComponent(xAccessTokenSecret)}`;
    const userInfoSignature = crypto.createHmac('sha1', userInfoSigningKey).update(userInfoSignatureBase).digest('base64');
    
    // Remove query params from OAuth header (they go in URL, not header)
    const oauthOnlyParams = { ...userInfoParams };
    delete oauthOnlyParams.include_email;
    oauthOnlyParams.oauth_signature = userInfoSignature;

    const userInfoAuthHeader = 'OAuth ' + Object.keys(oauthOnlyParams)
      .map(key => `${key}="${encodeURIComponent(oauthOnlyParams[key])}"`)
      .join(', ');

    console.log('User info auth header:', userInfoAuthHeader.substring(0, 150) + '...');

    // Get user info using v1.1 API
    let userResponse;
    try {
      userResponse = await axios.get(`${apiUrl}?${queryParams}`, {
        headers: {
          'Authorization': userInfoAuthHeader
        }
      });
    } catch (emailError) {
      console.log('Failed with include_email, trying without email parameter...');
      
      // Fallback: try without email parameter
      const simpleParams = {
        oauth_consumer_key: process.env.X_API_KEY,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: xAccessToken,
        oauth_version: '1.0'
      };

      const simpleParamString = Object.keys(simpleParams)
        .sort()
        .map(key => `${key}=${encodeURIComponent(simpleParams[key])}`)
        .join('&');
      
      const simpleSignatureBase = `GET&${encodeURIComponent(apiUrl)}&${encodeURIComponent(simpleParamString)}`;
      const simpleSignature = crypto.createHmac('sha1', userInfoSigningKey).update(simpleSignatureBase).digest('base64');
      
      simpleParams.oauth_signature = simpleSignature;

      const simpleAuthHeader = 'OAuth ' + Object.keys(simpleParams)
        .map(key => `${key}="${encodeURIComponent(simpleParams[key])}"`)
        .join(', ');

      userResponse = await axios.get(apiUrl, {
        headers: {
          'Authorization': simpleAuthHeader
        }
      });
    }

    // Use fallback approach - we already have basic user info from access token response
    console.log('Using access token response data instead of verify_credentials API');
    
    const userData = {
      id_str: user_id,
      screen_name: screen_name,
      name: screen_name, // Use screen_name as display name
      profile_image_url_https: `https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png`,
      followers_count: 0,
      description: `Connected via ${screen_name}`
    };
    
    console.log('X user info (from access token):', { 
      screen_name: userData.screen_name, 
      id: userData.id_str,
      user_id: user_id
    });

    // Save X account
    console.log('Saving X account to database...');
    const xAccount = await SocialAccount.create({
      userId: req.user.id,
      platform: 'x',
      accountId: userData.id_str,
      accountName: userData.screen_name,
      accessToken: xAccessToken,
      refreshToken: xAccessTokenSecret, // Store token secret as refresh token
      permissions: ['tweet.read', 'tweet.write', 'users.read'],
      accountData: {
        profilePicture: userData.profile_image_url_https,
        followerCount: userData.followers_count || 0,
        bio: userData.description || '',
        displayName: userData.name
      },
      isActive: true
    });

    console.log('X account successfully saved to database:', {
      id: xAccount._id,
      accountName: xAccount.accountName,
      userId: xAccount.userId
    });

    res.json({ 
      success: true, 
      message: 'X account connected successfully',
      account: {
        _id: xAccount._id,
        platform: xAccount.platform,
        accountName: xAccount.accountName,
        platformData: xAccount.platformData,
        isActive: xAccount.isActive
      }
    });

  } catch (error) {
    console.error('X auth error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      } : null
    });
    
    let errorMessage = 'X authentication failed';
    if (error.response?.data?.errors?.[0]?.message) {
      errorMessage = error.response.data.errors[0].message;
    } else if (error.response?.data?.error_description) {
      errorMessage = error.response.data.error_description;
    }

    // Clean up stored token secrets on error
    if (global.xTokenSecrets) {
      delete global.xTokenSecrets[req.user.id];
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data || error.message
    });
  }
});

// Disconnect specific account
router.delete('/accounts/:accountId', authenticateToken, async (req, res) => {
  try {
    const account = await SocialAccount.findOne({
      _id: req.params.accountId,
      userId: req.user.id 
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // If disconnecting Facebook, also remove connected Instagram accounts
    if (account.platform === 'facebook') {
      const connectedInstagram = await SocialAccount.find({
        userId: req.user.id,
        platform: 'instagram',
        'platformData.connectedFacebookPageId': { $in: account.platformData?.pages?.map(p => p.id) || [] }
      });

      if (connectedInstagram.length > 0) {
        await SocialAccount.deleteMany({
          _id: { $in: connectedInstagram.map(acc => acc._id) }
        });
        console.log(`🗑️  Also deleted ${connectedInstagram.length} connected Instagram accounts`);
      }
    }

    // Delete the main account
    await SocialAccount.findByIdAndDelete(account._id);

    console.log(`🗑️  Deleted ${account.platform} account: ${account.accountName}`);
    res.json({ 
      success: true, 
      message: `${account.platform} account disconnected successfully`,
      deletedAccount: {
        platform: account.platform,
        accountName: account.accountName
      }
    });
  } catch (error) {
    console.error('❌ Disconnect account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect all accounts for a platform
router.delete('/accounts/platform/:platform', authenticateToken, async (req, res) => {
  try {
    const result = await SocialAccount.deleteMany({
      userId: req.user.id,
      platform: req.params.platform
    });

    console.log(`Deleted ${result.deletedCount} ${req.params.platform} accounts for user ${req.user.id}`);
    res.json({ 
      success: true, 
      message: `All ${req.params.platform} accounts disconnected successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Disconnect platform accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up inactive accounts (utility route)
router.delete('/accounts/cleanup', authenticateToken, async (req, res) => {
  try {
    const result = await SocialAccount.deleteMany({
      userId: req.user.id,
      isActive: false
    });

    console.log(`Cleaned up ${result.deletedCount} inactive accounts for user ${req.user.id}`);
    res.json({ 
      success: true, 
      message: `Cleaned up ${result.deletedCount} inactive accounts`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix Facebook accounts structure (utility route)
router.post('/accounts/fix-facebook', authenticateToken, async (req, res) => {
  try {
    // Get all Facebook accounts for this user
    const facebookAccounts = await SocialAccount.find({
      userId: req.user.id,
      platform: 'facebook',
      isActive: true
    });

    if (facebookAccounts.length <= 1) {
      return res.json({ 
        success: true,
        message: 'Facebook accounts structure is already correct',
        accountCount: facebookAccounts.length
      });
    }

    // Find the main account (without pageType) and page accounts
    const mainAccount = facebookAccounts.find(acc => !acc.accountData?.pageType);
    const pageAccounts = facebookAccounts.filter(acc => acc.accountData?.pageType === 'page');

    if (!mainAccount) {
      return res.status(400).json({ error: 'No main Facebook account found' });
    }

    // Update main account with pages data
    const pagesData = pageAccounts.map(pageAcc => ({
      id: pageAcc.accountId,
      name: pageAcc.accountName,
      accessToken: pageAcc.accessToken,
      profilePicture: pageAcc.accountData?.profilePicture,
      followerCount: pageAcc.accountData?.followerCount || 0,
      category: 'Page'
    }));

    await SocialAccount.findByIdAndUpdate(mainAccount._id, {
      'accountData.pages': pagesData
    });

    // Delete the separate page accounts
    await SocialAccount.deleteMany({
      _id: { $in: pageAccounts.map(acc => acc._id) }
    });

    console.log(`Fixed Facebook structure for user ${req.user.id}: moved ${pageAccounts.length} pages to main account`);
    
    res.json({ 
      success: true,
      message: 'Facebook accounts structure fixed',
      mainAccount: mainAccount.accountName,
      pagesMovedToMain: pageAccounts.length,
      deletedPageAccounts: pageAccounts.length
    });
  } catch (error) {
    console.error('Fix Facebook accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post to LinkedIn (simplified for available scopes)
router.post('/accounts/:accountId/post', authenticateToken, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    
    const account = await SocialAccount.findOne({
      _id: req.params.accountId,
      userId: req.user.id,
      platform: 'linkedin'
    });

    if (!account) {
      return res.status(404).json({ error: 'LinkedIn account not found' });
    }

    // Simple text post using Share API (works with w_member_social scope)
    const postData = {
      author: `urn:li:person:${account.accountId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'  // Text only for now
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    res.json({
      success: true,
      postId: response.data.id,
      message: 'Posted to LinkedIn successfully'
    });

  } catch (error) {
    console.error('LinkedIn post error:', error.response?.data || error);
    res.status(500).json({ 
      error: 'Failed to post to LinkedIn',
      details: error.response?.data?.message || error.message
    });
  }
});

// Get LinkedIn Analytics (limited with available scopes)
router.get('/accounts/:accountId/analytics', authenticateToken, async (req, res) => {
  try {
    const account = await SocialAccount.findOne({
      _id: req.params.accountId,
      userId: req.user.id,
      platform: 'linkedin'
    });

    if (!account) {
      return res.status(404).json({ error: 'LinkedIn account not found' });
    }

    // With your current scopes, analytics are very limited
    const analytics = {
      platform: 'linkedin',
      accountType: 'personal',
      accountName: account.accountName,
      email: account.accountData.email,
      message: 'Limited analytics available with current LinkedIn app permissions',
      availableFeatures: [
        'Profile information',
        'Post creation', 
        'Basic account details'
      ],
      limitations: [
        'No follower count access',
        'No post engagement metrics', 
        'No impression data',
        'No organization/company page access'
      ]
    };

    res.json(analytics);
  } catch (error) {
    console.error('LinkedIn analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;