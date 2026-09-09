require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupulse';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB for migration');
    
    // Rename rollNumber to emisNumber across all student documents
    const result = await mongoose.connection.db.collection('students').updateMany(
      {},
      { $rename: { 'rollNumber': 'emisNumber' } }
    );
    
    console.log(`Migration completed. Modified ${result.modifiedCount} documents.`);
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
