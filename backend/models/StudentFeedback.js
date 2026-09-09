const mongoose = require('mongoose');

const studentFeedbackSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["text", "voice"],
    required: true
  },
  message: {
    type: String,
    maxlength: 1000,
    default: null
  },
  voiceData: {
    type: String, // Store as Base64 String
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
    // TTL index 'expires: 0' removed to preserve data history
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Enforce that text feedback has message and voice feedback has voiceData
studentFeedbackSchema.pre('save', function(next) {
  if (this.type === 'text' && (!this.message || this.message.trim().length === 0)) {
    const err = new Error('Text feedback must contain a message.');
    if (typeof next === 'function') return next(err);
    throw err;
  }
  if (this.type === 'voice' && !this.voiceData) {
    const err = new Error('Voice feedback must contain audio data.');
    if (typeof next === 'function') return next(err);
    throw err;
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.models.StudentFeedback || mongoose.model('StudentFeedback', studentFeedbackSchema);
