const express = require('express');
const router = express.Router();
const { getClassLeaderboard, getDashboardStats } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');

// All analytics routes require authentication
router.use(verifyToken);

router.get('/leaderboard', getClassLeaderboard);
router.get('/dashboard', getDashboardStats);

module.exports = router;
