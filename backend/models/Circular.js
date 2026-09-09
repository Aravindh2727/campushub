const mongoose = require('mongoose');

const circularSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  audience: {
    type: String,
    enum: ['All', 'Teacher', 'Student'],
    default: 'All'
  },
  fileUrl: {
    type: String, // Base64 for images/docs
    default: null
  },
  fileType: {
    type: String, // e.g. 'image', 'pdf', 'word'
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  postedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Auto-delete documents 1 week (604800 seconds) after they are created
circularSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Circular', circularSchema);
