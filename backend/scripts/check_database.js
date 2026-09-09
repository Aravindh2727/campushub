require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('ERROR: MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    const dbName = mongoose.connection.name;

    console.log(`Connected Database: ${dbName}`);

    if (dbName !== 'edupulse') {
      console.error(`ERROR: Connected to '${dbName}' instead of 'edupulse'.`);
      process.exit(1);
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const importantCollections = [
      'students',
      'users',
      'attendances',
      'classconfigs',
      'homeworks',
      'materials',
      'circulars',
      'studentfeedbacks'
    ];

    console.log('\n--- Collection Verification ---');
    for (const col of importantCollections) {
      if (collectionNames.includes(col)) {
        console.log(`✅ ${col} exists`);
      } else {
        console.log(`⚠️ ${col} is missing (it might just be empty)`);
      }
    }

    console.log('\nDatabase verification completed successfully!');
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

checkDatabase();
