const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, login, verifyEmail, resendVerificationCode, forgotPassword, verifyPasswordResetCode, resetPassword, googleAuthSuccess, googleAuthFailure } = require('../controllers/authController');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes working!', timestamp: new Date().toISOString() });
});

// Regular auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyPasswordResetCode);
router.post('/reset-password', resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }),
  googleAuthSuccess
);

router.get('/google/failure', googleAuthFailure);

module.exports = router;
