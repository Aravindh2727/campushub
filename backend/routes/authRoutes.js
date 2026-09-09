const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Temporary dump route without auth
router.get('/users/debug-dump', async (req, res) => {
  const mongoose = require('mongoose');
  const users = await mongoose.model('User').find({});
  res.json(users);
});

// Public endpoint for pre-login validation
router.get('/check-role', authController.checkRole);

// All auth routes require a valid Firebase JWT
router.use(verifyToken);

router.post('/sync', authController.syncUser);
router.get('/me', authController.getMe);
router.put('/me', authController.updateProfile);
router.get('/users', authController.getAllUsers);
router.get('/users/pending', authController.getPendingUsers);
router.put('/users/:uid/approve', authController.approveUser);
router.patch('/users/:uid/deactivate', authController.deactivateUser);
router.patch('/users/:uid/activate', authController.activateUser);
router.delete('/users/:uid', authController.deleteUser);

module.exports = router;
