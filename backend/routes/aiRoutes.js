const express = require('express');
const router = express.Router();
const { askAI } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');

// All AI routes require authentication
router.use(verifyToken);

router.post('/ask', askAI);

module.exports = router;
