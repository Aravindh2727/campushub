const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Student = require('../models/Student');

async function cleanupDuplicates() {
  let stats = {
    scanned: 0,
    withDuplicates: 0,
    termsFound: 0,
    removed: 0,
    conflicts: 0
  };

  try {
    console.log("Connecting to MongoDB...");
    // Assuming the app uses process.env.MONGODB_URI or defaults
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_db');
    console.log("Connected to MongoDB.");

    const students = await Student.find({});
    stats.scanned = students.length;

    for (const student of students) {
      if (!student.terms || student.terms.length === 0) continue;

      let hasDuplicates = false;
      const termMap = new Map();
      
      for (const term of student.terms) {
        stats.termsFound++;
        
        if (termMap.has(term.termName)) {
          hasDuplicates = true;
          // Note: In case of conflicts, we assume the last appended record is the newest/correct one
          stats.removed++;
        }
        // Always overwrite with the latest term data
        termMap.set(term.termName, term);
      }

      if (hasDuplicates) {
        stats.withDuplicates++;
        
        // Reconstruct the array without duplicates
        student.terms = Array.from(termMap.values());
        
        // Mark as modified so mongoose saves the array
        student.markModified('terms');
        await student.save({ validateModifiedOnly: true });
        
        console.log(`Cleaned duplicates for EMIS: ${student.emisNumber} (${student.name})`);
      }
    }

    console.log("\n=== CLEANUP REPORT ===");
    console.log(`Students scanned: ${stats.scanned}`);
    console.log(`Duplicate students found: ${stats.withDuplicates}`);
    console.log(`Duplicate terms found: ${stats.removed} (These were removed)`);
    console.log(`Total terms inspected: ${stats.termsFound}`);
    console.log(`Conflicts requiring review: ${stats.conflicts} (Handled by retaining last entry)`);
    console.log("======================\n");

  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

cleanupDuplicates();
