const admin = require('firebase-admin');

// Note: For production, you would use a service account key JSON file.
// Since we are setting up a skeleton, we initialize it dynamically.
// In a real environment:
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// For development without a key, we can initialize it with default credentials
// if running on Google Cloud, or we just leave it uninitialized until keys are provided.
// To prevent crashes during this demo, we'll try initializing with defaults or fake credentials.

try {
  admin.initializeApp();
} catch (e) {
  console.log('Firebase admin initialization failed (likely missing credentials). Proceeding for dev environment.');
}

module.exports = admin;
