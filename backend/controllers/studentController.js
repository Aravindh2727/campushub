const Student = require('../models/Student');
const ClassConfig = require('../models/ClassConfig');
const { sortStudentsByGenderAndName } = require('../utils/sortUtils');

const isAuthorizedForClass = (user, standard, section, requireFullAccess = false) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && user.assignedClasses) {
    const classAssignment = user.assignedClasses.find(c => c.standard === standard && c.section === section);
    if (!classAssignment) return false;
    if (requireFullAccess && classAssignment.accessLevel === 'view') return false;
    return true;
  }
  return false;
};

// Add a new student
const addStudent = async (req, res) => {
  try {
    const { 
      emisNumber, name, standard, section, gender, medium, photoUrl, 
      tamilName, fatherName, dob, admissionNumber, religion, community, 
      address, mobileNumber 
    } = req.body;

    if (!isAuthorizedForClass(req.dbUser, standard, section, true)) {
      return res.status(403).json({ error: 'Not authorized for full access to this class and section' });
    }

    // Check if student with same emisNumber in this class exists
    const existingStudent = await Student.findOne({ emisNumber, standard, section });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student with this EMIS number already exists in this class section.' });
    }

    const newStudent = new Student({
      emisNumber,
      name,
      standard,
      section,
      gender,
      medium,
      photoUrl,
      tamilName, 
      fatherName, 
      dob, 
      admissionNumber, 
      religion, 
      community, 
      address,
      mobileNumber,
      terms: [] // initialized empty
    });

    await newStudent.save();
    res.status(201).json({ success: true, data: newStudent });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk Add/Update Students (Admin Only)
const bulkAddStudents = async (req, res) => {
  try {
    const students = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: 'Expected an array of students' });
    }

    if (req.dbUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can perform bulk operations' });
    }

    const results = {
      added: 0,
      updated: 0,
      errors: []
    };

    const bulkOps = [];
    let validCount = 0;

    for (const studentData of students) {
      const { emisNumber, name, standard, section, gender, medium } = studentData;
      
      if (!emisNumber || !name || !standard || !section || !medium) {
        results.errors.push(`Row missing required fields (EMIS: ${emisNumber || 'N/A'})`);
        continue;
      }
      
      validCount++;

      bulkOps.push({
        updateOne: {
          filter: { emisNumber, standard, section },
          update: { 
            $set: studentData,
            $setOnInsert: { terms: [] }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      try {
        const bulkResult = await Student.bulkWrite(bulkOps);
        results.added = bulkResult.upsertedCount || 0;
        // Approximation of updated count since unchanged upserts don't count as modified
        results.updated = validCount - results.added; 
      } catch (bulkError) {
        console.error('BulkWrite Error:', bulkError);
        // Extract write errors if it's a bulk write error (e.g. duplicate key on old index)
        if (bulkError.writeErrors) {
          bulkError.writeErrors.forEach(err => {
            results.errors.push(`DB Error: ${err.errmsg}`);
          });
          results.added = bulkError.result.nUpserted || 0;
          results.updated = bulkError.result.nModified || 0;
        } else {
          results.errors.push(`Server Error during import: ${bulkError.message}`);
        }
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error in bulk add students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get students for a specific class and section
const getStudentsByClass = async (req, res) => {
  try {
    const { standard, section } = req.query;
    if (!standard || !section) {
      return res.status(400).json({ error: 'Standard and section are required parameters' });
    }

    const query = {};
    if (standard !== 'All') query.standard = standard;
    if (section !== 'All') query.section = section;

    if (req.dbUser && req.dbUser.role !== 'admin') {
      if (!req.dbUser.assignedClasses || req.dbUser.assignedClasses.length === 0) {
        return res.json({ success: true, data: [] });
      }

      if (standard !== 'All' && section !== 'All') {
        if (!isAuthorizedForClass(req.dbUser, standard, section)) {
          return res.status(403).json({ error: 'Not authorized for this class and section' });
        }
      } else {
        let validClasses = req.dbUser.assignedClasses;
        if (standard !== 'All') validClasses = validClasses.filter(c => c.standard === standard);
        if (section !== 'All') validClasses = validClasses.filter(c => c.section === section);
        
        if (validClasses.length === 0) {
           return res.json({ success: true, data: [] });
        }
        
        query.$or = validClasses.map(c => ({ standard: c.standard, section: c.section }));
      }
    }

    let students = await Student.find(query);
    students = sortStudentsByGenderAndName(students);
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update marks for a student
const updateStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { termName, marks } = req.body; 
    // marks should be an array: [{ subject: 'Math', score: 90 }, ...]

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
      return res.status(403).json({ error: 'Not authorized to modify this student' });
    }

    // Atomic Upsert Logic
    let action = 'updated';

    // Step 1: Try to update the existing term
    const updateResult = await Student.updateOne(
      { _id: studentId, "terms.termName": termName },
      { $set: { "terms.$.marks": marks } }
    );

    if (updateResult.matchedCount === 0) {
      // Step 2: Term does not exist. Try to conditionally push it.
      const pushResult = await Student.updateOne(
        { _id: studentId, "terms.termName": { $ne: termName } },
        { $push: { terms: { termName, marks } } }
      );
      
      action = 'created';

      if (pushResult.matchedCount === 0) {
        // Step 3: Conditional push failed. Another concurrent request pushed it!
        // Fallback to update.
        await Student.updateOne(
          { _id: studentId, "terms.termName": termName },
          { $set: { "terms.$.marks": marks } }
        );
        action = 'updated';
      }
    }

    // Fetch the updated student to return
    const updatedStudent = await Student.findById(studentId);
    res.status(200).json({ success: true, action, data: updatedStudent });
  } catch (error) {
    console.error('Error updating marks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk Update Marks
const bulkUpdateMarks = async (req, res) => {
  try {
    const { termName, records } = req.body;
    
    if (!termName || !Array.isArray(records)) {
      return res.status(400).json({ error: 'termName and records array are required' });
    }

    if (!req.dbUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const results = {
      updated: 0,
      errors: []
    };

    let validCount = 0;

    for (const record of records) {
      const { emisNumber, standard, section, marks } = record;
      
      if (!emisNumber || !standard || !section || !Array.isArray(marks)) {
        results.errors.push(`Row missing required fields (EMIS: ${emisNumber || 'N/A'})`);
        continue;
      }

      // Check authorization per student record
      if (!isAuthorizedForClass(req.dbUser, standard, section, true)) {
        results.errors.push(`Not authorized to update EMIS: ${emisNumber}`);
        continue;
      }

      // Find student
      const student = await Student.findOne({ emisNumber, standard, section });
      if (!student) {
        results.errors.push(`Student not found (EMIS: ${emisNumber})`);
        continue;
      }

      try {
        // Step 1: Try to update existing term
        const updateResult = await Student.updateOne(
          { _id: student._id, "terms.termName": termName },
          { $set: { "terms.$.marks": marks } }
        );

        let success = true;

        if (updateResult.matchedCount === 0) {
          // Step 2: Try to push conditionally
          const pushResult = await Student.updateOne(
            { _id: student._id, "terms.termName": { $ne: termName } },
            { $push: { terms: { termName, marks } } }
          );

          if (pushResult.matchedCount === 0) {
            // Step 3: Fallback update
            const fallbackUpdate = await Student.updateOne(
              { _id: student._id, "terms.termName": termName },
              { $set: { "terms.$.marks": marks } }
            );
            
            if (fallbackUpdate.matchedCount === 0) {
              success = false;
              results.errors.push(`Failed to update or create term for EMIS: ${emisNumber}`);
            }
          }
        }

        if (success) {
          results.updated++;
        }
      } catch (err) {
        results.errors.push(`Failed to save EMIS: ${emisNumber} - ${err.message}`);
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error in bulk update marks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Universal Bulk Update Marks (Classes 6-10)
const universalBulkUpdateMarks = async (req, res) => {
  try {
    const { termName, records } = req.body;
    
    if (!termName || !Array.isArray(records)) {
      return res.status(400).json({ error: 'termName and records array are required' });
    }

    if (!req.dbUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Step 1: Pre-validation Data Fetching
    const emisNumbers = records.map(r => r.emisNumber).filter(Boolean);
    
    // Check for duplicate EMIS within the uploaded file
    const emisSet = new Set();
    const duplicateEmisInFile = new Set();
    for (const emis of emisNumbers) {
      if (emisSet.has(emis)) duplicateEmisInFile.add(emis);
      emisSet.add(emis);
    }
    
    if (duplicateEmisInFile.size > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors: [`Duplicate EMIS Numbers found in the uploaded file: ${Array.from(duplicateEmisInFile).join(', ')}`]
      });
    }

    // Fetch all relevant students by EMIS
    const students = await Student.find({ emisNumber: { $in: emisNumbers } });
    const studentMap = new Map();
    students.forEach(s => studentMap.set(s.emisNumber, s));

    const validationErrors = [];

    // Step 2: Full Validation Loop
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const { emisNumber, standard, section, marks } = record;
      
      if (!emisNumber || !standard || !section || !Array.isArray(marks)) {
        validationErrors.push(`Row ${i + 2}: Missing required fields (EMIS: ${emisNumber || 'N/A'})`);
        continue;
      }

      const student = studentMap.get(emisNumber);
      if (!student) {
        validationErrors.push(`Row ${i + 2}: Student with EMIS ${emisNumber} not found in database.`);
        continue;
      }

      // Exact match for Standard and Section
      if (String(student.standard).trim().toUpperCase() !== String(standard).trim().toUpperCase()) {
        validationErrors.push(`Row ${i + 2}: Class mismatch for EMIS ${emisNumber}. Excel says ${standard}, DB says ${student.standard}.`);
      }
      
      if (String(student.section).trim().toUpperCase() !== String(section).trim().toUpperCase()) {
        validationErrors.push(`Row ${i + 2}: Section mismatch for EMIS ${emisNumber}. Excel says ${section}, DB says ${student.section}.`);
      }

      // Check authorization per student record
      if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
        validationErrors.push(`Row ${i + 2}: Not authorized to update EMIS ${emisNumber} (${student.standard}-${student.section}).`);
      }

      // Validate Marks
      for (const m of marks) {
        if (typeof m.score !== 'number' || isNaN(m.score) || m.score < 0 || m.score > 100) {
          validationErrors.push(`Row ${i + 2}: Invalid mark '${m.score}' for subject '${m.subject}' (EMIS: ${emisNumber}). Must be between 0 and 100.`);
        }
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors
      });
    }

    // Step 3: Execution Loop
    let updatedCount = 0;
    let createdCount = 0;
    let failedCount = 0;
    const executionErrors = [];

    for (const record of records) {
      const { emisNumber, marks } = record;
      const student = studentMap.get(emisNumber);

      try {
        // Atomic Upsert Logic
        const updateResult = await Student.updateOne(
          { _id: student._id, "terms.termName": termName },
          { $set: { "terms.$.marks": marks } }
        );

        if (updateResult.matchedCount > 0) {
          updatedCount++;
        } else {
          const pushResult = await Student.updateOne(
            { _id: student._id, "terms.termName": { $ne: termName } },
            { $push: { terms: { termName, marks } } }
          );

          if (pushResult.matchedCount > 0) {
            createdCount++;
          } else {
            const fallbackUpdate = await Student.updateOne(
              { _id: student._id, "terms.termName": termName },
              { $set: { "terms.$.marks": marks } }
            );
            
            if (fallbackUpdate.matchedCount > 0) {
              updatedCount++;
            } else {
              failedCount++;
              executionErrors.push(`Failed to update or create term for EMIS: ${emisNumber}`);
            }
          }
        }
      } catch (err) {
        failedCount++;
        executionErrors.push(`Failed to save EMIS: ${emisNumber} - ${err.message}`);
      }
    }

    res.status(200).json({ 
      success: true, 
      data: {
        total: records.length,
        updated: updatedCount,
        created: createdCount,
        failed: failedCount,
        errors: executionErrors
      }
    });

  } catch (error) {
    console.error('Error in universal bulk update marks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updateData = req.body;
    console.log("Updating student:", studentId, "Mobile Number:", updateData.mobileNumber);

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
      return res.status(403).json({ error: 'Not authorized to modify this student' });
    }

    if (updateData.standard && updateData.section && !isAuthorizedForClass(req.dbUser, updateData.standard, updateData.section, true)) {
      return res.status(403).json({ error: 'Not authorized to move student to this class and section' });
    }

    const updatedStudent = await Student.findByIdAndUpdate(studentId, updateData, { new: true });
    res.status(200).json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    // Optional: check if authorized for this class, but maybe allow any teacher to view profile if they can see top 3
    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
      return res.status(403).json({ error: 'Not authorized to delete this student' });
    }

    await Student.findByIdAndDelete(studentId);
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk delete students
const bulkDeleteStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'No student IDs provided' });
    }

    // Find students first to verify authorization
    const students = await Student.find({ _id: { $in: studentIds } });
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'No students found' });
    }

    // Verify auth for all students
    for (const student of students) {
      if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
        return res.status(403).json({ error: 'Not authorized to delete some of these students' });
      }
    }

    await Student.deleteMany({ _id: { $in: studentIds } });
    res.status(200).json({ success: true, message: `${students.length} students deleted successfully` });
  } catch (error) {
    console.error('Error bulk deleting students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Temporary fix to drop the old rollNumber index from the database
const fixDbIndex = async (req, res) => {
  try {
    const collection = Student.collection;
    let messages = [];

    try {
      await collection.dropIndex('standard_1_section_1_rollNumber_1');
      messages.push('Successfully dropped standard_1_section_1_rollNumber_1');
    } catch (e) {
      messages.push(`Index standard_1_section_1_rollNumber_1 not found or error: ${e.message}`);
    }

    try {
      await collection.dropIndex('rollNumber_1');
      messages.push('Successfully dropped rollNumber_1');
    } catch (e) {
      messages.push(`Index rollNumber_1 not found or error: ${e.message}`);
    }

    // Ensure emisNumber index exists
    await Student.syncIndexes();
    messages.push('Synced new indexes (emisNumber).');

    res.status(200).send(`
      <html><body>
        <h2>Database Index Fix Completed</h2>
        <ul>${messages.map(m => `<li>${m}</li>`).join('')}</ul>
        <p>You can now go back to your app and import the CSV!</p>
      </body></html>
    `);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// Temporary fix to sync old student marks with current Class Config subjects
const fixSubjects = async (req, res) => {
  try {
    const students = await Student.find();
    const classConfigs = await ClassConfig.find();
    let updatedCount = 0;

    for (let student of students) {
      const config = classConfigs.find(c => c.standard === student.standard && c.section === student.section);
      if (!config || !config.subjects || config.subjects.length === 0) continue;

      let modified = false;
      for (let term of student.terms) {
        if (!term.marks) continue;
        const newMarks = [];
        
        for (let subj of config.subjects) {
          // Try to match existing marks case-insensitively (e.g. "TAMIL" matches "Tamil")
          const existingMark = term.marks.find(m => m.subject.toLowerCase() === subj.toLowerCase());
          if (existingMark) {
             newMarks.push({ subject: subj, score: existingMark.score });
          } else {
             newMarks.push({ subject: subj, score: 0 }); // Missing subjects get 0
          }
        }
        
        // Check if marks array actually changed
        if (JSON.stringify(term.marks) !== JSON.stringify(newMarks)) {
          term.marks = newMarks;
          modified = true;
        }
      }

      if (modified) {
        student.markModified('terms');
        await student.save({ validateModifiedOnly: true });
        updatedCount++;
      }
    }

    res.status(200).send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #62D4CA;">Subject Fix Completed!</h2>
          <p>Successfully aligned database subjects with current Class Configs for <strong>${updatedCount}</strong> students.</p>
          <p>You can now go back to the Student Portal and the subjects will display correctly.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

module.exports = {
  addStudent,
  getStudentsByClass,
  getStudentById,
  updateStudentMarks,
  bulkUpdateMarks,
  universalBulkUpdateMarks,
  updateStudent,
  deleteStudent,
  bulkAddStudents,
  bulkDeleteStudents,
  fixDbIndex,
  fixSubjects
};
