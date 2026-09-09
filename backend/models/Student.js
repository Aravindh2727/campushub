const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { _id: false });

const termSchema = new mongoose.Schema({
  termName: {
    type: String,
    enum: ['First Midterm', 'Quarterly', 'Second Midterm', 'Half-Yearly', 'Third Midterm', 'Annual'],
    required: true
  },
  marks: [markSchema]
}, { _id: false });

const studentSchema = new mongoose.Schema({
  emisNumber: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
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
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  medium: {
    type: String,
    required: true,
    enum: ['TAMIL', 'ENGLISH'],
    trim: true
  },
  photoUrl: {
    type: String,
    trim: true,
    default: null
  },
  tamilName: {
    type: String,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  dob: {
    type: String,
    trim: true
  },
  admissionNumber: {
    type: String,
    trim: true
  },
  religion: {
    type: String,
    trim: true
  },
  community: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  terms: [termSchema]
}, {
  timestamps: true
});

// Ensure unique EMIS number per standard and section
studentSchema.index({ standard: 1, section: 1, emisNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
