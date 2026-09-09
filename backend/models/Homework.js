const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  standard: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  assignedBy: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String, // Will store base64 or cloudinary URL
    default: null
  },
  photoUrls: {
    type: [String],
    default: []
  },
  voiceUrl: {
    type: String, // Will store base64 audio
    default: null
  },
  link: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Auto-delete documents 48 hours (172800 seconds) after they are created
homeworkSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });

module.exports = mongoose.model('Homework', homeworkSchema);
