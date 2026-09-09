const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const StudentFeedback = require('./models/StudentFeedback');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const feedback = new StudentFeedback({
      studentId: new mongoose.Types.ObjectId(),
      type: 'text',
      message: 'Test message',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await feedback.save();
    console.log('Feedback saved successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
