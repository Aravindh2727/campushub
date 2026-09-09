const mongoose = require('mongoose');

const classConfigSchema = new mongoose.Schema({
  standard: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  subjects: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Ensure unique standard and section combination
classConfigSchema.index({ standard: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('ClassConfig', classConfigSchema);
