const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const adController = require('../controllers/adController');

// POST /api/ads/generate - Generate ad with AI models
router.post('/generate', authenticateToken, adController.generateAd);

// POST /api/ads/enhance-prompt - Enhance prompt with AI
router.post('/enhance-prompt', authenticateToken, adController.enhancePrompt);

// GET /api/ads/my-ads - Get all generated ads for the current user
router.get('/my-ads', authenticateToken, adController.getMyAds);

// DELETE /api/ads/:id - Delete a generated ad
router.delete('/:id', authenticateToken, adController.deleteAd);

// GET /api/ads/presets - Get preset styles and templates
router.get('/presets', adController.getPresets);

module.exports = router;
