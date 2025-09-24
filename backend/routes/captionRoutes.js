const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');


router.get('/', (req, res) => {
  res.json({ msg: 'Caption route works' });
});


module.exports = router;
