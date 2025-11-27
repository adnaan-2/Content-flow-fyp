const User = require('../models/User'); // Fixed import path
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateVerificationCode, generateResetToken, sendVerificationEmail, sendPasswordResetEmail, sendPasswordResetCodeEmail, sendWelcomeEmail, sendNewDeviceLoginEmail } = require('../utils/emailService');
const { getDeviceInfo, createDeviceFingerprint, isNewDevice, addKnownDevice, updateDeviceLastUsed, getLocationFromIP } = require('../utils/deviceUtils');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Log the request body for debugging
    console.log('Registration request body:', req.body);
    
    // Validation
    if (!name || !email || !password) {
      console.log('Missing fields - name:', !!name, 'email:', !!email, 'password:', !!password);
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Additional validation
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists with email:', email, 'authProvider:', existingUser.authProvider);
      
      // Check if user registered with Google
      if (existingUser.authProvider === 'google' && existingUser.googleId) {
        return res.status(400).json({ 
          success: false, 
          message: 'This email is already registered with Google. Please sign in with Google instead.',
          conflictType: 'google_account_exists',
          suggestedAction: 'signin_with_google'
        });
      }
      
      // Check if user registered with email but not verified
      if (!existingUser.isVerified) {
        return res.status(400).json({ 
          success: false, 
          message: 'This email is already registered but not verified. Please check your email for verification code or request a new one.',
          conflictType: 'unverified_email_account',
          suggestedAction: 'verify_email'
        });
      }
      
      // User exists with email and is verified
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already registered. Please sign in with your email and password instead.',
        conflictType: 'email_account_exists',
        suggestedAction: 'signin_with_email'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('Creating user with data:', {
      name: name.trim(),
      email: email.toLowerCase(),
      hashedPassword: !!hashedPassword,
      verificationCode,
      verificationCodeExpires
    });

    // Create user but don't verify yet
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpires
    });

    console.log('User created successfully:', newUser._id);

    // Create free trial subscription for new user
    try {
      const Subscription = require('../models/Subscription');
      await Subscription.create({
        userId: newUser._id,
        planType: 'basic',
        status: 'trial'
      });
      console.log('Free trial subscription created for user:', newUser._id);
    } catch (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError);
      // Don't fail registration due to subscription creation error
    }

    // Send verification email (make this optional for testing)
    try {
      const emailResult = await sendVerificationEmail(email.toLowerCase(), name.trim(), verificationCode);
      
      if (!emailResult.success) {
        console.log('Email sending failed but user created:', emailResult.error);
        // Don't delete user, just warn about email issue
        return res.status(201).json({
          success: true,
          message: 'Registration successful! However, verification email could not be sent. Please contact support.',
          userId: newUser._id,
          email: newUser.email,
          requiresVerification: true,
          emailWarning: true
        });
      }
      
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Don't fail registration due to email issues
      return res.status(201).json({
        success: true,
        message: 'Registration successful! However, verification email could not be sent. Please contact support.',
        userId: newUser._id,
        email: newUser.email,
        requiresVerification: true,
        emailWarning: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for verification code.',
      userId: newUser._id,
      email: newUser.email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed: ' + messages.join(', ')
      });
    }
    
    // Handle duplicate key error (if user already exists)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists'
      });
    }
    
    // Handle bcrypt errors
    if (error.message && error.message.includes('bcrypt')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password processing failed'
      });
    }
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify email with code
const verifyEmail = async (req, res) => {
  const { userId, verificationCode } = req.body;

  try {
    if (!userId || !verificationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and verification code are required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Check if code is expired
    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Check if code matches
    if (user.verificationCode !== verificationCode.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Update user as verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Send welcome email after successful verification
    try {
      await sendWelcomeEmail(user.email, user.name, 'email');
      console.log('Welcome email sent to:', user.email);
    } catch (error) {
      console.error('Welcome email sending error:', error);
      // Don't fail the verification if email fails
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Resend verification code
const resendVerificationCode = async (req, res) => {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send new verification email
    const emailResult = await sendVerificationEmail(user.email, user.name, verificationCode);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email!'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    console.log('Login attempt for email:', email.toLowerCase());

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      hasPassword: !!user.password,
      authProvider: user.authProvider,
      hasGoogleId: !!user.googleId
    });

    // Check if user was registered with Google OAuth and has no password
    if (user.authProvider === 'google' && user.googleId && !user.password) {
      console.log('Login failed: User registered with Google OAuth, no password set');
      return res.status(400).json({ 
        success: false, 
        message: 'This account was created with Google. Please sign in with Google instead.',
        conflictType: 'google_oauth_account',
        suggestedAction: 'signin_with_google'
      });
    }

    // Check if user has no password (shouldn't happen, but safety check)
    if (!user.password) {
      console.log('Login failed: User has no password');
      return res.status(400).json({ 
        success: false, 
        message: 'Account has no password set. Please use the forgot password feature or sign in with Google if this account was created with Google.',
        conflictType: 'no_password',
        suggestedAction: 'forgot_password_or_google'
      });
    }

    console.log('Comparing passwords...');
    console.log('Provided password length:', password.length);
    console.log('Stored password hash length:', user.password.length);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      console.log('Login failed: Email not verified');
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        userId: user._id,
        email: user.email
      });
    }

    console.log('Login successful for user:', user.email);

    // Get device information for security tracking
    const userAgent = req.headers['user-agent'] || '';
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown';
    const deviceInfo = getDeviceInfo(userAgent, clientIP);
    const deviceFingerprint = createDeviceFingerprint(deviceInfo);
    const location = getLocationFromIP(clientIP);

    // Check if this is a new device
    const newDevice = isNewDevice(user, deviceFingerprint);
    
    if (newDevice) {
      console.log('New device detected for user:', user.email);
      
      // Send new device notification email
      try {
        await sendNewDeviceLoginEmail(user.email, user.name, deviceInfo, location);
        console.log('New device login email sent to:', user.email);
      } catch (error) {
        console.error('New device login email sending error:', error);
        // Don't fail the login if email fails
      }
      
      // Add device to known devices
      await addKnownDevice(user, deviceInfo, deviceFingerprint);
    } else {
      // Update last used time for existing device
      await updateDeviceLastUsed(user, deviceFingerprint);
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Forgot password - Send verification code
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    console.log('Forgot password request for email:', email.toLowerCase());

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        success: true, 
        message: 'If an account with this email exists, you will receive a verification code shortly.',
        requiresVerification: true
      });
    }

    // Generate verification code (6 digits)
    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save verification code to user
    user.passwordResetCode = verificationCode;
    user.passwordResetCodeExpires = codeExpires;
    await user.save();

    console.log('Password reset verification code generated for user:', user.email);

    // Send verification code email
    try {
      const emailResult = await sendPasswordResetCodeEmail(user.email, user.name, verificationCode);
      
      if (!emailResult.success) {
        console.log('Password reset code email failed:', emailResult.error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send verification code. Please try again.' 
        });
      }
      
      console.log('Password reset code email sent successfully');
      
      res.status(200).json({
        success: true,
        message: 'Verification code has been sent to your email address.',
        requiresVerification: true,
        email: user.email
      });
    } catch (emailError) {
      console.error('Email service error:', emailError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification code. Please try again.' 
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify password reset code
const verifyPasswordResetCode = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    if (!email || !verificationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and verification code' 
      });
    }

    if (verificationCode.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 6-digit verification code' 
      });
    }

    console.log('Password reset code verification for email:', email.toLowerCase());

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      passwordResetCode: verificationCode,
      passwordResetCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      console.log('Invalid or expired verification code');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code' 
      });
    }

    console.log('Valid verification code for user:', user.email);

    // Generate a temporary token for password reset (valid for 15 minutes)
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token and clear verification code
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    user.passwordResetCode = null;
    user.passwordResetCodeExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Verification code confirmed. You can now reset your password.',
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Verify password reset code error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  try {
    // Validation
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide reset token, new password, and confirm password' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check for strong password (at least one letter and one number)
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must contain at least one letter and one number' 
      });
    }

    console.log('Password reset attempt with token:', token);

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      console.log('Invalid or expired reset token');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    console.log('Valid reset token found for user:', user.email);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    console.log('Password reset successful for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Google OAuth success callback
const googleAuthSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
    }

    console.log('Google auth success for user:', req.user.email);

    // Generate JWT token
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profilePicture: req.user.profilePicture,
      isVerified: req.user.isVerified,
      authProvider: req.user.authProvider
    }))}`);
  } catch (error) {
    console.error('Google auth success error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};

// Google OAuth failure callback
const googleAuthFailure = (req, res) => {
  console.log('Google auth failed');
  res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
};

module.exports = { register, login, verifyEmail, resendVerificationCode, forgotPassword, verifyPasswordResetCode, resetPassword, googleAuthSuccess, googleAuthFailure };
