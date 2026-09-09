const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'teacher'],
    default: 'teacher'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedClasses: [{
    standard: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    accessLevel: {
      type: String,
      enum: ['view', 'full'],
      default: 'full'
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
