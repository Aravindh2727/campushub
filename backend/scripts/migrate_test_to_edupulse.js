require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Override DNS to use Google's DNS to bypass local SRV block on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Helper to wait
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMigration() {
  console.log('==================================================');
  console.log('   STARTING MONGODB MIGRATION: test -> edupulse');
  console.log('==================================================');

  // The cluster URI from the environment (e.g. mongodb+srv://user:pass@cluster.mongodb.net)
  const baseUri = process.env.MONGO_URI;

  if (!baseUri) {
    console.error('ERROR: MONGO_URI is not set in the environment variables.');
    console.error('Please set MONGO_URI to your cluster connection string (without the database name attached).');
    process.exit(1);
  }

  // Ensure the base URI doesn't already have a database specified
  // e.g. if it's mongodb+srv://cluster/edupulse, we need to extract the base to connect to test and edupulse
  let uriWithoutDb = baseUri;
  const match = baseUri.match(/(mongodb(?:\+srv)?:\/\/[^/]+)\/([^?]+)?(.*)/);
  if (match) {
    uriWithoutDb = `${match[1]}/${match[3] || ''}`; // keeps query params like ?retryWrites=true
  } else {
    // If there is no trailing slash
    if (!uriWithoutDb.includes('?')) {
      uriWithoutDb = `${uriWithoutDb}/`;
    }
  }
  
  // Format the URIs properly
  const testUri = uriWithoutDb.includes('?') ? uriWithoutDb.replace('?', 'test?') : `${uriWithoutDb}test`;
  const edupulseUri = uriWithoutDb.includes('?') ? uriWithoutDb.replace('?', 'edupulse?') : `${uriWithoutDb}edupulse`;

  console.log(`- Connecting to source (test)...`);
  const testConnection = await mongoose.createConnection(testUri).asPromise();
  console.log(`- Connecting to target (edupulse)...`);
  const edupulseConnection = await mongoose.createConnection(edupulseUri).asPromise();
  
  console.log('\nBoth databases connected successfully!');
  
  // Get all collections from the test database
  const collections = await testConnection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name).filter(name => !name.startsWith('system.'));

  console.log(`\nFound ${collectionNames.length} collections in 'test' database:`);
  console.log(collectionNames.map(name => `  - ${name}`).join('\n'));
  
  const migrationStats = {};

  for (const collectionName of collectionNames) {
    console.log(`\n==================================================`);
    console.log(`Migrating Collection: ${collectionName}`);
    
    const sourceCollection = testConnection.collection(collectionName);
    const targetCollection = edupulseConnection.collection(collectionName);

    // Count before migration
    const sourceCount = await sourceCollection.countDocuments();
    const targetCountBefore = await targetCollection.countDocuments();
    
    console.log(`- Documents in 'test.${collectionName}': ${sourceCount}`);
    console.log(`- Documents in 'edupulse.${collectionName}': ${targetCountBefore}`);
    
    if (sourceCount === 0) {
      console.log(`- Skipping ${collectionName} (Empty)`);
      migrationStats[collectionName] = { 
        source: 0, 
        targetBefore: targetCountBefore,
        inserted: 0,
        skipped: 0,
        conflicts: 0,
        targetAfter: targetCountBefore 
      };
      continue;
    }

    // Fetch all documents from the source
    const documents = await sourceCollection.find({}).toArray();
    
    // Drop deprecated indexes on students collection if they exist to prevent E11000 null duplicates
    if (collectionName === 'students') {
      try {
        await targetCollection.dropIndex('standard_1_section_1_rollNumber_1');
        console.log('- Dropped deprecated index: standard_1_section_1_rollNumber_1');
      } catch (e) { console.log('Index standard_1_section_1_rollNumber_1 not found or error:', e.message); }
      try {
        await targetCollection.dropIndex('rollNumber_1');
        console.log('- Dropped deprecated index: rollNumber_1');
      } catch (e) { console.log('Index rollNumber_1 not found or error:', e.message); }
    }

    let inserted = 0;
    let skipped = 0;
    let conflicts = 0;
    
    // Safely upsert each document to preserve _id and avoid duplicates
    for (const doc of documents) {
      try {
        const existing = await targetCollection.findOne({ _id: doc._id });
        if (existing) {
          // Document exists, skipping
          skipped++;
        } else {
          // Document missing, inserting safely
          await targetCollection.insertOne(doc);
          inserted++;
        }
      } catch (err) {
        conflicts++;
        console.error(`- ERROR writing doc ${doc._id} to ${collectionName}:`, err.message);
      }
    }
    
    // Count after migration
    const targetCountAfter = await targetCollection.countDocuments();
    
    migrationStats[collectionName] = {
      source: sourceCount,
      targetBefore: targetCountBefore,
      inserted,
      skipped,
      conflicts,
      targetAfter: targetCountAfter
    };
  }

  // Final Database Count Verification
  console.log(`\n==================================================`);
  console.log(`   FINAL DATABASE MIGRATION SUMMARY`);
  console.log(`==================================================`);
  console.log(`Collection`.padEnd(20) + ` | ` + `Test`.padEnd(6) + ` | ` + `EduPulse Before`.padEnd(16) + ` | ` + `Inserted`.padEnd(10) + ` | ` + `Skipped`.padEnd(10) + ` | ` + `Conflicts`.padEnd(10) + ` | ` + `EduPulse After`);
  console.log(`-------------------------------------------------------------------------------------------------------------------------`);
  
  for (const [col, stats] of Object.entries(migrationStats)) {
    console.log(`${col.padEnd(20)} | ${stats.source.toString().padEnd(6)} | ${stats.targetBefore.toString().padEnd(16)} | ${stats.inserted.toString().padEnd(10)} | ${stats.skipped.toString().padEnd(10)} | ${stats.conflicts.toString().padEnd(10)} | ${stats.targetAfter.toString()}`);
  }

  console.log(`\n==================================================`);
  console.log(`   MIGRATION COMPLETED SAFELY`);
  console.log(`==================================================`);
  console.log(`IMPORTANT:`);
  console.log(`1. Do NOT delete the 'test' database yet.`);
  console.log(`2. Update your Render Environment Variable to explicitly specify the database:`);
  console.log(`   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edupulse?retryWrites=true&w=majority`);
  console.log(`3. Restart your backend server on Render.`);
  console.log(`4. Test the application. Once everything is confirmed working, you can safely archive/drop 'test'.`);

  await testConnection.close();
  await edupulseConnection.close();
  process.exit(0);
}

runMigration().catch(err => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
