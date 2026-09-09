const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const StudentFeedback = require('../models/StudentFeedback');

const checkAdmin = (req, res, next) => {
  if (req.user?.studentId) {
    return res.status(403).json({ success: false, message: 'Forbidden: Students cannot access admin feedback' });
  }
  if (req.dbUser && req.dbUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }
  next();
};

// GET /api/feedback
// Get all active feedback (for admins)
router.get('/', verifyToken, checkAdmin, async (req, res) => {
  try {
    // We explicitly filter where expiresAt is strictly in the future,
    // providing a safety net if MongoDB TTL hasn't run yet.
    const feedbackList = await StudentFeedback.find({
      expiresAt: { $gt: new Date() },
      isDeleted: { $ne: true }
    })
      .populate('studentId', 'name emisNumber standard section mobileNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: feedbackList });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Server error fetching feedback' });
  }
});

// DELETE /api/feedback/:id
// Delete a feedback record
router.delete('/:id', verifyToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await StudentFeedback.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.dbUser ? req.dbUser._id : null
        }
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error deleting feedback' });
  }
});

module.exports = router;
