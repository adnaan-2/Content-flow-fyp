const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (email, name, verificationCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your ContentFlow Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ContentFlow!</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for signing up for ContentFlow! To complete your registration, please verify your email address using the code below:
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${verificationCode}</span>
              </div>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              This verification code will expire in <strong>10 minutes</strong>. If you didn't create an account with ContentFlow, please ignore this email.
            </p>
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #999; font-size: 12px;">
                This is an automated email, please do not reply to this message.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your ContentFlow Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              We received a request to reset your password for your ContentFlow account. If you didn't make this request, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              To reset your password, click the button below:
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 14px; color: #667eea;">
              ${resetUrl}
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              This password reset link will expire in <strong>1 hour</strong> for security reasons.
            </p>
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #999; font-size: 12px;">
                This is an automated email, please do not reply to this message.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Password reset email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset verification code email
const sendPasswordResetCodeEmail = async (email, name, verificationCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Verification Code - ContentFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Code</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              We received a request to reset your password for your ContentFlow account. Please use the verification code below to proceed with resetting your password:
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${verificationCode}</span>
              </div>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              This verification code will expire in <strong>10 minutes</strong> for security reasons. If you didn't request a password reset, please ignore this email.
            </p>
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #999; font-size: 12px;">
                This is an automated email, please do not reply to this message.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset code email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Password reset code email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after successful registration
const sendWelcomeEmail = async (email, name, registrationMethod = 'email') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to ContentFlow! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to ContentFlow!</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              🎊 Congratulations! You've successfully created your ContentFlow account ${registrationMethod === 'google' ? 'using Google Sign-In' : 'with email registration'}. 
              We're excited to have you join our community of content creators!
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0;">🚀 What's Next?</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">📱 Connect your social media accounts (Facebook, Instagram, LinkedIn, X)</li>
                <li style="margin-bottom: 10px;">✨ Create your first post with AI-powered content generation</li>
                <li style="margin-bottom: 10px;">📅 Schedule posts across multiple platforms</li>
                <li style="margin-bottom: 10px;">📊 Track your content performance with analytics</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
                🎯 Get Started Now
              </a>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Need help getting started? Our support team is here to help! Simply reply to this email or visit our help center.
            </p>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Welcome aboard! 🚀<br>
                The ContentFlow Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send new device login notification
const sendNewDeviceLoginEmail = async (email, name, deviceInfo, location = 'Unknown') => {
  try {
    const currentDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔐 New Device Login Alert - ContentFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 New Device Login</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              We detected a new login to your ContentFlow account from a device we haven't seen before. Here are the details:
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #856404; margin: 0 0 15px 0;">📱 Login Details:</h3>
              <div style="color: #856404;">
                <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${currentDate}</p>
                <p style="margin: 5px 0;"><strong>📱 Device:</strong> ${deviceInfo.browser || 'Unknown Browser'} on ${deviceInfo.os || 'Unknown OS'}</p>
                <p style="margin: 5px 0;"><strong>🌍 Location:</strong> ${location}</p>
                <p style="margin: 5px 0;"><strong>📡 IP Address:</strong> ${deviceInfo.ip || 'Unknown'}</p>
              </div>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="color: #155724; margin: 0; font-weight: bold;">✅ Was this you?</p>
              <p style="color: #155724; margin: 10px 0 0 0;">If this login was authorized by you, no further action is needed. Your account remains secure.</p>
            </div>

            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="color: #721c24; margin: 0; font-weight: bold;">⚠️ Didn't recognize this login?</p>
              <p style="color: #721c24; margin: 10px 0;">If you didn't sign in from this device, please:</p>
              <ol style="color: #721c24; margin: 10px 0; padding-left: 20px;">
                <li>Change your password immediately</li>
                <li>Review your account security settings</li>
                <li>Contact our support team</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard/security" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin-right: 10px;">
                🔒 Security Settings
              </a>
              <a href="${process.env.CLIENT_URL}/change-password" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin-left: 10px;">
                🔑 Change Password
              </a>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated security notification from ContentFlow.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('New device login email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('New device login email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send social account connection notification
const sendSocialAccountConnectedEmail = async (email, name, platform, accountName) => {
  try {
    const platformEmojis = {
      'facebook': '📘',
      'instagram': '📸',
      'linkedin': '💼',
      'x': '🐦',
      'twitter': '🐦'
    };

    const platformNames = {
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'linkedin': 'LinkedIn',
      'x': 'X (Twitter)',
      'twitter': 'X (Twitter)'
    };

    const emoji = platformEmojis[platform.toLowerCase()] || '🔗';
    const platformName = platformNames[platform.toLowerCase()] || platform;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `${emoji} ${platformName} Account Connected - ContentFlow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${emoji} Account Connected!</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Great news! You've successfully connected your <strong>${platformName}</strong> account to ContentFlow. 
              You can now create and schedule posts directly to this platform! 🎉
            </p>
            
            <div style="background: #d1f2eb; border: 1px solid #a3e4d7; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <h3 style="color: #0e6655; margin: 0 0 10px 0;">${emoji} Connected Account</h3>
              <p style="color: #0e6655; margin: 0; font-size: 18px; font-weight: bold;">${accountName}</p>
              <p style="color: #0e6655; margin: 5px 0 0 0; font-size: 14px;">on ${platformName}</p>
            </div>

            <div style="background: #f8f9fa; border-left: 4px solid #1dd1a1; padding: 20px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0;">🚀 What You Can Do Now:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">✨ Create AI-powered content for ${platformName}</li>
                <li style="margin-bottom: 10px;">📅 Schedule posts to publish automatically</li>
                <li style="margin-bottom: 10px;">📊 Track engagement and performance</li>
                <li style="margin-bottom: 10px;">🔄 Cross-post to multiple platforms simultaneously</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard/create-post" style="background: linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin-right: 10px;">
                ✨ Create First Post
              </a>
              <a href="${process.env.CLIENT_URL}/dashboard/social-accounts" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin-left: 10px;">
                ⚙️ Manage Accounts
              </a>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              You can disconnect this account anytime from your social accounts settings. We'll never post without your explicit permission.
            </p>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Keep creating amazing content! 🚀<br>
                The ContentFlow Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`${platformName} connection email sent:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Social account connection email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send post scheduled notification
const sendPostScheduledEmail = async (email, name, postDetails) => {
  try {
    const scheduledDate = new Date(postDetails.scheduledTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const platforms = postDetails.platforms || [];
    const platformsList = platforms.map(p => {
      const emojis = {
        'facebook': '📘 Facebook',
        'instagram': '📸 Instagram',
        'linkedin': '💼 LinkedIn',
        'x': '🐦 X (Twitter)',
        'twitter': '🐦 X (Twitter)'
      };
      return emojis[p.toLowerCase()] || `🔗 ${p}`;
    }).join(', ');

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '📅 Post Scheduled Successfully - ContentFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #3742fa 0%, #2f3542 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📅 Post Scheduled!</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Perfect! Your post has been scheduled and will be automatically published to your selected social media platforms. ⏰
            </p>
            
            <div style="background: #e7f3ff; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #0c5460; margin: 0 0 15px 0;">📝 Post Details:</h3>
              <div style="color: #0c5460;">
                <p style="margin: 10px 0;"><strong>📅 Scheduled Time:</strong> ${scheduledDate}</p>
                <p style="margin: 10px 0;"><strong>📱 Platforms:</strong> ${platformsList}</p>
                ${postDetails.title ? `<p style="margin: 10px 0;"><strong>📄 Title:</strong> ${postDetails.title}</p>` : ''}
                ${postDetails.content ? `<div style="margin: 15px 0;"><strong>📝 Content Preview:</strong><br><div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px; font-style: italic;">${postDetails.content.substring(0, 200)}${postDetails.content.length > 200 ? '...' : ''}</div></div>` : ''}
              </div>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #155724; margin: 0 0 15px 0;">✅ What Happens Next:</h3>
              <ul style="color: #155724; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">📬 We'll send you a confirmation when your post is published</li>
                <li style="margin-bottom: 10px;">📊 You can track performance in your analytics dashboard</li>
                <li style="margin-bottom: 10px;">✏️ You can edit or cancel the post anytime before it's published</li>
                <li style="margin-bottom: 10px;">🔄 Set up recurring posts for consistent engagement</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard/scheduled-posts" style="background: linear-gradient(135deg, #3742fa 0%, #2f3542 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin-right: 10px;">
                📅 View Scheduled Posts
              </a>
              <a href="${process.env.CLIENT_URL}/dashboard/create-post" style="background: linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin-left: 10px;">
                ✨ Create Another Post
              </a>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Need to make changes? Visit your scheduled posts dashboard to edit or reschedule this post before it goes live.
            </p>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Keep scheduling, keep growing! 📈<br>
                The ContentFlow Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Post scheduled email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Post scheduled email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send post published notification
const sendPostPublishedEmail = async (email, name, postDetails) => {
  try {
    const publishedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const platforms = postDetails.platforms || [];
    const platformsList = platforms.map(p => {
      const emojis = {
        'facebook': '📘 Facebook',
        'instagram': '📸 Instagram',
        'linkedin': '💼 LinkedIn',
        'x': '🐦 X (Twitter)',
        'twitter': '🐦 X (Twitter)'
      };
      return emojis[p.toLowerCase()] || `🔗 ${p}`;
    }).join(', ');

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🚀 Post Published Successfully - ContentFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Post Published!</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Awesome! Your content has been successfully published and is now live on your social media platforms! 🎉
            </p>
            
            <div style="background: #e8f5e8; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #155724; margin: 0 0 15px 0;">📝 Published Post Details:</h3>
              <div style="color: #155724;">
                <p style="margin: 10px 0;"><strong>📅 Published Time:</strong> ${publishedDate}</p>
                <p style="margin: 10px 0;"><strong>📱 Live on Platforms:</strong> ${platformsList}</p>
                ${postDetails.title ? `<p style="margin: 10px 0;"><strong>📄 Title:</strong> ${postDetails.title}</p>` : ''}
                ${postDetails.content ? `<div style="margin: 15px 0;"><strong>📝 Content:</strong><br><div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px; font-style: italic;">${postDetails.content.substring(0, 200)}${postDetails.content.length > 200 ? '...' : ''}</div></div>` : ''}
              </div>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #856404; margin: 0 0 15px 0;">📊 Track Your Success:</h3>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">📈 Monitor engagement (likes, comments, shares)</li>
                <li style="margin-bottom: 10px;">👥 Track audience reach and impressions</li>
                <li style="margin-bottom: 10px;">💬 Respond to comments and messages</li>
                <li style="margin-bottom: 10px;">📋 Analyze performance to optimize future content</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard/analytics" style="background: linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin-right: 10px;">
                📊 View Analytics
              </a>
              <a href="${process.env.CLIENT_URL}/dashboard/create-post" style="background: linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin-left: 10px;">
                ✨ Create Next Post
              </a>
            </div>

            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <h4 style="color: #333; margin: 0 0 10px 0;">💡 Pro Tip</h4>
              <p style="color: #666; margin: 0; font-size: 14px;">
                Engage with your audience within the first hour of posting for maximum reach and visibility!
              </p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Keep creating, keep growing! 🌟<br>
                The ContentFlow Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Post published email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Post published email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password change success email (security notification)
const sendPasswordChangeSuccessEmail = async (email, name, changeTime, deviceInfo) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Changed Successfully - ContentFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed Successfully</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your ContentFlow account password has been successfully changed.
            </p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">Change Details:</h3>
              <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${changeTime}</p>
              <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Device:</strong> ${deviceInfo}</p>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #d97706; margin: 0 0 15px 0; font-size: 18px;">⚠️ Security Notice</h3>
              <p style="color: #374151; margin: 5px 0; font-size: 14px;">
                If you didn't make this change, your account may be compromised. Please contact our support team immediately.
              </p>
            </div>

            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.FRONTEND_URL}/dashboard/profile" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Your Profile
              </a>
            </div>

            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 10px 0;">
                Best regards,<br>
                The ContentFlow Team
              </p>
              <p style="color: #d1d5db; font-size: 12px; margin-top: 20px;">
                This is an automated security notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password change success email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Password change success email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateVerificationCode,
  generateResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetCodeEmail,
  sendWelcomeEmail,
  sendNewDeviceLoginEmail,
  sendPasswordChangeSuccessEmail,
  // Note: Removed sendSocialAccountConnectedEmail, sendPostScheduledEmail, sendPostPublishedEmail
  // These are now handled by notificationService.js for in-app notifications
};