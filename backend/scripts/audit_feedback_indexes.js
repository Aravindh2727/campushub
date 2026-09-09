const mongoose = require('mongoose');
require('dotenv').config();

// Ensure we connect to edupulse
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupulse';

async function auditAndDropTTL() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to Database: ${mongoose.connection.name}`);

    if (mongoose.connection.name !== 'edupulse') {
      throw new Error(`Connected to wrong database: ${mongoose.connection.name}. Expected 'edupulse'.`);
    }

    const db = mongoose.connection.db;
    const collection = db.collection('studentfeedbacks');

    console.log('\n--- 1. FETCHING CURRENT INDEXES ---');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    let ttlIndexName = null;
    let ttlIndexFound = false;

    // Find the TTL index on expiresAt with expireAfterSeconds: 0
    indexes.forEach((index) => {
      if (
        index.key &&
        index.key.expiresAt === 1 &&
        index.expireAfterSeconds === 0
      ) {
        ttlIndexFound = true;
        ttlIndexName = index.name;
      }
    });

    if (ttlIndexFound) {
      console.log(`\n--- 2. OBSOLETE TTL INDEX FOUND ---`);
      console.log(`Target Index Name: ${ttlIndexName}`);
      console.log(`Dropping index ${ttlIndexName}...`);

      try {
        await collection.dropIndex(ttlIndexName);
        console.log(`SUCCESS: Index ${ttlIndexName} dropped successfully.`);
      } catch (err) {
        console.error(`FAILED: Could not drop index. Error:`, err);
      }
    } else {
      console.log('\n--- 2. NO OBSOLETE TTL INDEX FOUND ---');
      console.log('Safe: No index with expireAfterSeconds: 0 on expiresAt exists.');
    }

    console.log('\n--- 3. VERIFYING FINAL INDEXES ---');
    const finalIndexes = await collection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));

    const stillExists = finalIndexes.some(
      (idx) => idx.key.expiresAt === 1 && idx.expireAfterSeconds === 0
    );

    if (stillExists) {
      console.error('\nCRITICAL WARNING: The TTL index still exists! Physical deletion may still occur.');
    } else {
      console.log('\nVERIFIED: MongoDB TTL will no longer physically delete expired Student Feedback.');
      console.log('Normal indexes (e.g. _id, studentId) have been completely preserved.');
    }

  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

auditAndDropTTL();
