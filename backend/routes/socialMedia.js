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
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Facebook OAuth initiation
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

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI + '?platform=facebook')}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `state=${req.user.id}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Facebook auth initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Facebook OAuth callback
router.post('/auth/facebook/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      params: {
        access_token: access_token,
        fields: 'id,name,email,picture'
      }
    });

    // Clear any existing Facebook accounts for this user (enforce one account per platform)
    await SocialAccount.deleteMany({
      userId: req.user.id,
      platform: 'facebook'
    });

    // Get user's Facebook pages
    const pagesResponse = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
      params: {
        access_token: access_token,
        fields: 'id,name,access_token,picture,fan_count,instagram_business_account'
      }
    });

    // Save personal Facebook account first
    const personalAccount = await SocialAccount.create({
      userId: req.user.id,
      platform: 'facebook',
      accountId: userResponse.data.id,
      accountName: userResponse.data.name,
      accessToken: access_token,
      permissions: ['pages_manage_posts', 'pages_read_engagement'],
      accountData: {
        profilePicture: userResponse.data.picture?.data?.url,
        followerCount: 0,
        bio: ''
      }
    });

    // Save all Facebook pages
    const savedPages = [];
    if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
      for (const page of pagesResponse.data.data) {
        const pageAccount = await SocialAccount.create({
          userId: req.user.id,
          platform: 'facebook',
          accountId: page.id,
          accountName: page.name,
          accessToken: page.access_token,
          permissions: ['pages_manage_posts', 'pages_read_engagement'],
          accountData: {
            profilePicture: page.picture?.data?.url,
            followerCount: page.fan_count || 0,
            bio: '',
            pageType: 'page'
          }
        });
        savedPages.push(pageAccount);
      }
    }

    // Handle Instagram business accounts from saved pages
    if (savedPages.length > 0) {
      // Clear any existing Instagram accounts for this user
      await SocialAccount.deleteMany({
        userId: req.user.id,
        platform: 'instagram'
      });

      for (const pageData of pagesResponse.data.data) {
        if (pageData.instagram_business_account) {
          try {
            const instagramData = await axios.get(`https://graph.facebook.com/v18.0/${pageData.instagram_business_account.id}`, {
              params: {
                access_token: pageData.access_token,
                fields: 'id,username,profile_picture_url,followers_count,biography'
              }
            });

            await SocialAccount.create({
              userId: req.user.id,
              platform: 'instagram',
              accountId: instagramData.data.id,
              accountName: instagramData.data.username,
              accessToken: pageData.access_token,
              permissions: ['instagram_basic', 'instagram_content_publish'],
              accountData: {
                profilePicture: instagramData.data.profile_picture_url,
                followerCount: instagramData.data.followers_count || 0,
                bio: instagramData.data.biography || ''
              }
            });
          } catch (instagramError) {
            console.error('Error saving Instagram account:', instagramError);
          }
        }
      }
    }

    res.json({ success: true, message: 'Facebook and Instagram accounts connected successfully' });
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// LinkedIn OAuth initiation
router.get('/auth/linkedin', authenticateToken, async (req, res) => {
  try {
    if (!process.env.LINKEDIN_CLIENT_ID) {
      return res.status(500).json({ error: 'LinkedIn client ID not configured' });
    }

    const scopes = [
      'openid',
      'profile',
      'email',
      'w_member_social',
      'r_organization_social',
      'rw_organization_admin',
      'r_basicprofile',
      'r_1st_connections_size'
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

// LinkedIn OAuth callback
router.post('/auth/linkedin/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;

    // Clear any existing LinkedIn accounts for this user
    await SocialAccount.deleteMany({
      userId: req.user.id,
      platform: 'linkedin'
    });

    // Get user profile using new API
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const profile = profileResponse.data;

    // Get additional profile data
    let profilePicture = profile.picture;
    let connectionsCount = 0;

    try {
      // Try to get profile picture from v2 API if not available
      if (!profilePicture) {
        const profilePicResponse = await axios.get('https://api.linkedin.com/v2/people/~:(id,profilePicture(displayImage~:playableStreams))', {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        profilePicture = profilePicResponse.data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier;
      }

      // Get connections count
      const connectionsResponse = await axios.get('https://api.linkedin.com/v2/people/~/network/network-sizes?edgeType=FIRST_DEGREE_CONNECTION', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      connectionsCount = connectionsResponse.data.firstDegreeSize || 0;
    } catch (additionalDataError) {
      console.log('Could not fetch additional profile data:', additionalDataError.message);
    }

    // Save personal LinkedIn account
    const personalAccount = await SocialAccount.create({
      userId: req.user.id,
      platform: 'linkedin',
      accountId: profile.sub,
      accountName: profile.name,
      accessToken: access_token,
      permissions: ['w_member_social', 'r_organization_social'],
      accountData: {
        profilePicture: profilePicture,
        followerCount: connectionsCount,
        bio: '',
        email: profile.email
      }
    });

    // Try to get organization pages the user manages
    try {
      const organizationsResponse = await axios.get('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,name,logoV2(original~:playableStreams),followerCount)))', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      const organizations = organizationsResponse.data.elements || [];
      
      // Save each organization page the user can manage
      for (const orgElement of organizations) {
        const org = orgElement.organization;
        if (org) {
          await SocialAccount.create({
            userId: req.user.id,
            platform: 'linkedin',
            accountId: org.id,
            accountName: org.name,
            accessToken: access_token,
            permissions: ['w_organization_social', 'r_organization_social'],
            accountData: {
              profilePicture: org.logoV2?.original?.elements?.[0]?.identifiers?.[0]?.identifier,
              followerCount: org.followerCount || 0,
              bio: '',
              pageType: 'organization'
            }
          });
        }
      }
    } catch (orgError) {
      console.log('Could not fetch organization pages:', orgError.message);
    }

    res.json({ success: true, message: 'LinkedIn account and pages connected successfully' });
  } catch (error) {
    console.error('LinkedIn auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// X (Twitter) OAuth initiation
router.get('/auth/x', authenticateToken, async (req, res) => {
  try {
    if (!process.env.TWITTER_CLIENT_ID) {
      return res.status(500).json({ error: 'X (Twitter) client ID not configured' });
    }

    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${process.env.TWITTER_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=tweet.read%20tweet.write%20users.read%20offline.access&` +
      `state=${req.user.id}&` +
      `code_challenge=challenge&` +
      `code_challenge_method=plain`;

    res.json({ authUrl });
  } catch (error) {
    console.error('X auth initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// X (Twitter) OAuth callback
router.post('/auth/x/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', {
      code: code,
      grant_type: 'authorization_code',
      client_id: process.env.TWITTER_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: 'challenge'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Get user profile
    const userResponse = await axios.get('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,description', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const user = userResponse.data.data;

    // Clear any existing X accounts for this user (enforce one account per platform)
    await SocialAccount.deleteMany({
      userId: req.user.id,
      platform: 'x'
    });

    await SocialAccount.create({
      userId: req.user.id,
      platform: 'x',
      accountId: user.id,
      accountName: user.username,
      accessToken: access_token,
      refreshToken: refresh_token,
      permissions: ['tweet.read', 'tweet.write', 'users.read'],
      accountData: {
        profilePicture: user.profile_image_url,
        followerCount: user.public_metrics?.followers_count || 0,
        bio: user.description || ''
      }
    });

    res.json({ success: true, message: 'X account connected successfully' });
  } catch (error) {
    console.error('X auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect account
router.delete('/accounts/:accountId', authenticateToken, async (req, res) => {
  try {
    const deletedAccount = await SocialAccount.findOneAndDelete({
      _id: req.params.accountId,
      userId: req.user.id 
    });

    if (!deletedAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    console.log(`Account ${deletedAccount.platform} - ${deletedAccount.accountName} deleted for user ${req.user.id}`);
    res.json({ success: true, message: 'Account disconnected and removed successfully' });
  } catch (error) {
    console.error('Disconnect account error:', error);
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

// Post to LinkedIn
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

    let postData;
    
    if (account.accountData.pageType === 'organization') {
      // Post as organization/company page
      postData = {
        author: `urn:li:organization:${account.accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      if (imageUrl) {
        // Handle image upload (simplified version)
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: 'Image'
          },
          media: imageUrl,
          title: {
            text: 'Shared Image'
          }
        }];
      }
    } else {
      // Post as personal profile
      postData = {
        author: `urn:li:person:${account.accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      if (imageUrl) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: 'Image'
          },
          media: imageUrl,
          title: {
            text: 'Shared Image'
          }
        }];
      }
    }

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

// Get LinkedIn Analytics
router.get('/accounts/:accountId/analytics', authenticateToken, async (req, res) => {
  try {
    const account = await SocialAccount.findOne({
      _id: req.params.accountId,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    let analytics = {};

    if (account.platform === 'linkedin') {
      try {
        if (account.accountData.pageType === 'organization') {
          // Get organization analytics
          const response = await axios.get(`https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${account.accountId}`, {
            headers: {
              'Authorization': `Bearer ${account.accessToken}`
            }
          });
          
          analytics = {
            platform: 'linkedin',
            accountType: 'organization',
            followerStats: response.data,
            followers: account.accountData.followerCount
          };
        } else {
          // Get personal profile analytics (limited)
          analytics = {
            platform: 'linkedin',
            accountType: 'personal',
            connections: account.accountData.followerCount,
            message: 'Personal LinkedIn analytics are limited via API'
          };
        }
      } catch (analyticsError) {
        console.error('LinkedIn analytics error:', analyticsError);
        analytics = { 
          error: 'Unable to fetch LinkedIn analytics',
          details: analyticsError.response?.data?.message || analyticsError.message
        };
      }
    } else if (account.platform === 'facebook') {
      try {
        const response = await axios.get(`https://graph.facebook.com/v18.0/${account.accountId}/insights`, {
          params: {
            access_token: account.accessToken,
            metric: 'page_impressions,page_reach,page_engaged_users',
            period: 'day',
            since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        });
        analytics = response.data;
      } catch (analyticsError) {
        console.error('Facebook analytics error:', analyticsError);
        analytics = { error: 'Unable to fetch Facebook analytics' };
      }
    }

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;