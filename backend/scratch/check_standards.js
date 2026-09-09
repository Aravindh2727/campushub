const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Student = require('./models/Student');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const standards = await Student.distinct('standard');
    console.log('Distinct standards:', standards);
    
    // Also fetch one student from 10th and one from 12th to see their data
    const std10 = await Student.findOne({ standard: '10' }).select('standard section terms');
    const std12 = await Student.findOne({ standard: '12' }).select('standard section terms');
    console.log('Sample 10th:', JSON.stringify(std10, null, 2));
    console.log('Sample 12th:', JSON.stringify(std12, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
