const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/caption
// @desc    Test route
// @access  Public
router.get('/', (req, res) => {
  res.json({ msg: 'Caption route works' });
});

// Add more caption-related routes as needed

module.exports = router;
