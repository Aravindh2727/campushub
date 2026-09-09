const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
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
  link: {
    type: String,
    required: true,
    trim: true
  },
  uploadedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
