require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

async function migrate() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupulse';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Add attendanceType to existing records if missing
    console.log('Updating existing records to have attendanceType: period');
    await Attendance.updateMany(
      { attendanceType: { $exists: false } },
      { $set: { attendanceType: 'period' } }
    );
    console.log('Records updated.');

    // Attempt to drop the old index
    try {
      await Attendance.collection.dropIndex('date_1_standard_1_section_1_period_1');
      console.log('Old index date_1_standard_1_section_1_period_1 dropped successfully.');
    } catch (e) {
      if (e.codeName === 'IndexNotFound') {
        console.log('Old index not found, skipping drop.');
      } else {
        console.error('Error dropping old index:', e);
      }
    }

    // Creating new index explicitly (Mongoose handles it on startup, but we do it here just in case)
    await Attendance.collection.createIndex(
      { date: 1, standard: 1, section: 1, attendanceType: 1, period: 1 },
      { unique: true }
    );
    console.log('New index created successfully.');
    
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
