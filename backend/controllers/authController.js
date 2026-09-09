const User = require('../models/User');

// POST /api/auth/sync
// Called after Firebase login/register to sync user to MongoDB
exports.syncUser = async (req, res) => {
  try {
    const { uid, email, name } = req.user; // from auth middleware
    
    // Check if user already exists
    let user = await User.findOne({ uid });
    
    if (!user) {
      const userEmail = email || req.body.email;
      
      const isAdminEmail = userEmail === 'dadapuramghss@gmail.com';

      user = new User({
        uid,
        email: userEmail,
        name: name || req.body.name || userEmail?.split('@')[0],
        role: isAdminEmail ? 'admin' : 'teacher',
        status: isAdminEmail ? 'approved' : 'pending'
      });
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: 'Server error syncing user' });
  }
};

// GET /api/auth/check-role
// Public endpoint to check role by email before login
exports.checkRole = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // If not in DB, they might be an admin based on hardcoded email, or unknown
      const isAdminEmail = email.toLowerCase() === 'dadapuramghss@gmail.com';
      return res.json({ role: isAdminEmail ? 'admin' : 'unknown' });
    }
    
    res.json({ role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/auth/me
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { name },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    if (!req.dbUser || req.dbUser.role !== 'admin') {
      console.log('getAllUsers: Access denied for', req.dbUser?.email, 'role:', req.dbUser?.role);
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    const users = await User.find().sort({ createdAt: -1 });
    console.log(`getAllUsers: returning ${users.length} users to Admin:`, JSON.stringify(users, null, 2));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/users/pending (Admin only)
exports.getPendingUsers = async (req, res) => {
  try {
    // Check if requester is admin using req.dbUser
    if (!req.dbUser || req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const pendingUsers = await User.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/auth/users/:uid/approve (Admin only)
exports.approveUser = async (req, res) => {
  try {
    if (!req.dbUser || req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const targetUid = req.params.uid;
    const { status, role, assignedClasses } = req.body; // allow setting role and classes during approval

    const updateData = { 
      status: status || 'approved', 
      role: role || 'teacher' 
    };
    if (assignedClasses !== undefined) {
      updateData.assignedClasses = assignedClasses;
    }

    const user = await User.findOneAndUpdate(
      { uid: targetUid },
      updateData,
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/auth/users/:uid
exports.deleteUser = async (req, res) => {
  try {
    // Only admins can delete users
    if (!req.dbUser || req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { uid } = req.params;

    // Prevent self-deletion
    if (req.user.uid === uid) {
      return res.status(403).json({ message: 'Access denied: Cannot delete your own account' });
    }

    // Delete from MongoDB
    const deletedUser = await User.findOneAndDelete({ uid });
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    // Delete from Firebase Auth using firebase-admin
    try {
      const admin = require('firebase-admin');
      await admin.auth().deleteUser(uid);
    } catch (firebaseErr) {
      console.error('Failed to delete user from Firebase (may already be deleted):', firebaseErr);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

// PATCH /api/auth/users/:uid/deactivate (Admin only)
exports.deactivateUser = async (req, res) => {
  try {
    if (!req.dbUser || req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { uid } = req.params;

    if (req.user.uid === uid) {
      return res.status(403).json({ message: 'Access denied: Cannot deactivate your own account' });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { isActive: false },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    console.error('deactivateUser error:', error);
    res.status(500).json({ message: 'Server error while deactivating user' });
  }
};

// PATCH /api/auth/users/:uid/activate (Admin only)
exports.activateUser = async (req, res) => {
  try {
    if (!req.dbUser || req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { uid } = req.params;

    const user = await User.findOneAndUpdate(
      { uid },
      { isActive: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    console.error('activateUser error:', error);
    res.status(500).json({ message: 'Server error while activating user' });
  }
};
