const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present'
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  date: {
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
  attendanceType: {
    type: String,
    enum: ['daily', 'period'],
    default: 'period'
  },
  period: {
    type: Number,
    min: 1,
    max: 8
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  records: [attendanceRecordSchema]
}, {
  timestamps: true
});

// Ensure unique record per class per type per day (and period if applicable)
attendanceSchema.index({ date: 1, standard: 1, section: 1, attendanceType: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
