const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    console.log('Dropping index standard_1_section_1_rollNumber_1...');
    try {
      await collection.dropIndex('standard_1_section_1_rollNumber_1');
      console.log('Index standard_1_section_1_rollNumber_1 dropped successfully.');
    } catch (e) {
      if (e.codeName === 'IndexNotFound') {
        console.log('Index standard_1_section_1_rollNumber_1 not found, skipping.');
      } else {
        console.error('Error dropping index:', e);
      }
    }
    
    // Also drop rollNumber_1 if it exists
    try {
      await collection.dropIndex('rollNumber_1');
      console.log('Index rollNumber_1 dropped successfully.');
    } catch (e) {
      if (e.codeName === 'IndexNotFound') {
        console.log('Index rollNumber_1 not found, skipping.');
      } else {
        console.error('Error dropping index rollNumber_1:', e);
      }
    }

    console.log('Syncing mongoose indexes to ensure emisNumber index exists...');
    const Student = require('./models/Student');
    await Student.syncIndexes();
    console.log('Indexes synced successfully.');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

dropIndex();
