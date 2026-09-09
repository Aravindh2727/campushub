const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  addHomework,
  getHomeworkByClass,
  deleteHomework
} = require('../controllers/homeworkController');

// All routes require authentication
router.use(verifyToken);

// Get homework for a specific class
router.get('/', getHomeworkByClass);

// Add new homework
router.post('/', addHomework);

// Delete homework
router.delete('/:homeworkId', deleteHomework);

module.exports = router;
