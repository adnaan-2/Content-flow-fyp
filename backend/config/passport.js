const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/emailService');

// Debug environment variables
console.log('Passport Config - Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('Passport Config - Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('Passport Config - Google Callback URL:', process.env.GOOGLE_CALLBACK_URL);

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth callback - Profile:', profile);
    
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      console.log('Existing Google user found:', user.email);
      return done(null, user);
    }
    
    // Check if user exists with the same email (link accounts)
    user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.authProvider = 'google';
      if (profile.photos && profile.photos.length > 0) {
        user.profilePicture = profile.photos[0].value;
      }
      await user.save();
      console.log('Linked Google account to existing user:', user.email);
      return done(null, user);
    }
    
    // Create new user
    const newUser = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value.toLowerCase(),
      authProvider: 'google',
      profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : 'default-avatar.png',
      isVerified: true, // Google users are automatically verified
    });
    
    console.log('Created new Google user:', newUser.email);
    
    // Send welcome email for new Google users
    try {
      await sendWelcomeEmail(newUser.email, newUser.name, 'google');
      console.log('Welcome email sent to new Google user:', newUser.email);
    } catch (error) {
      console.error('Welcome email sending error for Google user:', error);
      // Don't fail the authentication if email fails
    }
    
    return done(null, newUser);
    
  } catch (error) {
    console.error('Google OAuth Strategy Error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;