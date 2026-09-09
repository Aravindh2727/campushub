const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { verifyStudentToken } = require('../middleware/studentAuth');
const StudentFeedback = require('../models/StudentFeedback');

const JWT_SECRET = process.env.JWT_SECRET || 'edupulse_student_secret_key_2026';

// POST /api/student-portal/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, mobileNumber } = req.body;
    const loginId = identifier || mobileNumber;

    if (!loginId) {
      return res.status(400).json({ message: 'Mobile number or EMIS number is required' });
    }

    const students = await Student.find({
      $or: [
        { mobileNumber: loginId },
        { emisNumber: loginId }
      ]
    });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'Student account not found' });
    }

    if (students.length > 1) {
      // Multiple students share this number (e.g. siblings)
      const mappedStudents = students.map(s => ({
        _id: s._id,
        name: s.name,
        standard: s.standard,
        section: s.section,
        emisNumber: s.emisNumber
      }));
      return res.json({ requiresSelection: true, students: mappedStudents });
    }

    // Only 1 student found, require password (DOB)
    const student = students[0];

    res.json({
      requiresPassword: true,
      studentId: student._id,
      studentName: student.name
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/student-portal/login-verify
router.post('/login-verify', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    if (!studentId || !password) {
      return res.status(400).json({ message: 'Student ID and Password are required' });
    }

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student account not found' });
    }

    if (!student.dob) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Verify Password (DOB in DDMMYYYY format)
    let dbDob = String(student.dob).trim();
    if (dbDob.includes('T')) {
      dbDob = dbDob.split('T')[0];
    }
    
    let year, month, day;
    const parts = dbDob.split(/[-/]/);
    
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
      } else if (parts[2].length === 4) {
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
      } else {
        return res.status(401).json({ message: 'Invalid DB DOB Format: ' + dbDob });
      }
    } else {
      return res.status(401).json({ message: 'Invalid DB DOB String: ' + dbDob });
    }

    const expectedPassword1 = `${day}${month}${year}`;
    const expectedPassword2 = `${month}${day}${year}`;

    if (password !== expectedPassword1 && password !== expectedPassword2) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Initial multi-account payload
    const activeStudentId = student._id.toString();
    const linkedAccounts = [{
      studentId: activeStudentId,
      name: student.name,
      standard: student.standard,
      section: student.section,
      emisNumber: student.emisNumber
    }];

    // Generate JWT
    const token = jwt.sign(
      { activeStudentId, linkedAccounts },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Strip sensitive info
    const studentData = student.toObject();
    delete studentData.dob;

    res.json({
      message: 'Login successful',
      token,
      student: studentData
    });
  } catch (error) {
    console.error('Student login-verify error:', error);
    res.status(500).json({ message: 'Server error during login verification' });
  }
});

// POST /api/student-portal/accounts/add
router.post('/accounts/add', verifyStudentToken, async (req, res) => {
  try {
    const { identifier, mobileNumber, password } = req.body;
    const loginId = identifier || mobileNumber;

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Login ID and Password are required' });
    }

    const students = await Student.find({
      $or: [
        { mobileNumber: loginId },
        { emisNumber: loginId }
      ]
    });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'Student account not found' });
    }

    // For simplicity if multiple siblings share mobile, we check all of them against password
    let matchedStudent = null;
    for (const s of students) {
      if (!s.dob) continue;
      let dbDob = String(s.dob).trim();
      if (dbDob.includes('T')) dbDob = dbDob.split('T')[0];
      
      const parts = dbDob.split(/[-/]/);
      let year, month, day;
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parts[0]; month = parts[1].padStart(2, '0'); day = parts[2].padStart(2, '0');
        } else if (parts[2].length === 4) {
          day = parts[0].padStart(2, '0'); month = parts[1].padStart(2, '0'); year = parts[2];
        }
      }
      
      const p1 = `${day}${month}${year}`;
      const p2 = `${month}${day}${year}`;
      
      if (password === p1 || password === p2) {
        matchedStudent = s;
        break;
      }
    }

    if (!matchedStudent) {
      return res.status(401).json({ message: 'Unable to verify this student account. Invalid credentials.' });
    }

    // Check if already linked
    const existingAccounts = req.decodedToken.linkedAccounts || [];
    const newStudentIdStr = matchedStudent._id.toString();
    
    if (existingAccounts.some(acc => acc.studentId === newStudentIdStr)) {
      return res.status(400).json({ message: 'This student account is already added.' });
    }

    // Add to linked accounts
    const newLinkedAccounts = [...existingAccounts, {
      studentId: newStudentIdStr,
      name: matchedStudent.name,
      standard: matchedStudent.standard,
      section: matchedStudent.section,
      emisNumber: matchedStudent.emisNumber
    }];

    // Generate new JWT
    const token = jwt.sign(
      { activeStudentId: newStudentIdStr, linkedAccounts: newLinkedAccounts },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const studentData = matchedStudent.toObject();
    delete studentData.dob;

    res.json({
      message: 'Account added successfully',
      token,
      student: studentData
    });

  } catch (error) {
    console.error('Add account error:', error);
    res.status(500).json({ message: 'Server error during account addition' });
  }
});

// POST /api/student-portal/accounts/switch
router.post('/accounts/switch', verifyStudentToken, async (req, res) => {
  try {
    const { targetStudentId } = req.body;
    
    if (!targetStudentId) {
      return res.status(400).json({ message: 'Target student ID is required' });
    }

    const existingAccounts = req.decodedToken.linkedAccounts || [];
    
    // Verify target exists in session
    const targetAccount = existingAccounts.find(acc => acc.studentId === targetStudentId);
    if (!targetAccount) {
      return res.status(403).json({ message: 'You are not authorized to switch to this account.' });
    }

    // Generate new JWT with swapped active ID
    const token = jwt.sign(
      { activeStudentId: targetStudentId, linkedAccounts: existingAccounts },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Switched account successfully',
      token
    });
  } catch (error) {
    console.error('Switch account error:', error);
    res.status(500).json({ message: 'Server error during account switch' });
  }
});

// POST /api/student-portal/accounts/remove
router.post('/accounts/remove', verifyStudentToken, async (req, res) => {
  try {
    const { targetStudentId } = req.body;
    
    if (!targetStudentId) {
      return res.status(400).json({ message: 'Target student ID is required' });
    }

    const existingAccounts = req.decodedToken.linkedAccounts || [];
    const newLinkedAccounts = existingAccounts.filter(acc => acc.studentId !== targetStudentId);

    if (newLinkedAccounts.length === 0) {
      // Last account removed, signal client to logout
      return res.json({ requireLogout: true });
    }

    let newActiveId = req.decodedToken.activeStudentId;
    // If we removed the currently active account, fallback to the first available
    if (newActiveId === targetStudentId) {
      newActiveId = newLinkedAccounts[0].studentId;
    }

    const token = jwt.sign(
      { activeStudentId: newActiveId, linkedAccounts: newLinkedAccounts },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Account removed successfully',
      token
    });
  } catch (error) {
    console.error('Remove account error:', error);
    res.status(500).json({ message: 'Server error during account removal' });
  }
});

// GET /api/student-portal/me
router.get('/me', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student.toObject();

    // Calculate class rank for each term
    const peers = await Student.find({ standard: student.standard, section: student.section }).lean();
    
    student.terms = student.terms.map(term => {
      const myScore = term.marks.reduce((sum, m) => sum + m.score, 0);
      let betterStudents = 0;
      let totalAssessed = 0;
      
      peers.forEach(peer => {
        const peerTerm = peer.terms?.find(t => t.termName === term.termName);
        if (peerTerm && peerTerm.marks && peerTerm.marks.length > 0) {
          totalAssessed++;
          const peerScore = peerTerm.marks.reduce((sum, m) => sum + m.score, 0);
          if (peerScore > myScore) {
            betterStudents++;
          }
        }
      });
      
      return {
        ...term,
        rank: betterStudents + 1,
        totalAssessed
      };
    });

    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-portal/homework
router.get('/homework', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student;

    const Homework = require('../models/Homework');
    const homeworkList = await Homework.find({
      standard: student.standard,
      section: student.section
    }).sort({ dueDate: 1 });

    res.json({ success: true, data: homeworkList });
  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-portal/circulars
router.get('/circulars', verifyStudentToken, async (req, res) => {
  try {
    const Circular = require('../models/Circular');
    const circulars = await Circular.find({ audience: { $in: ['All', 'Student'] } }).sort({ createdAt: -1 });
    res.json({ success: true, data: circulars });
  } catch (error) {
    console.error('Error fetching circulars:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-portal/attendance
router.get('/attendance', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student;
    const Attendance = require('../models/Attendance');

    const attendances = await Attendance.find({
      standard: student.standard,
      section: student.section,
      isSubmitted: true,
      'records.student': student._id
    }).sort({ date: -1, period: 1 });

    const grouped = {};
    attendances.forEach(att => {
      if (!grouped[att.date]) {
        grouped[att.date] = { 
          date: att.date, 
          periods: { 1: '-', 2: '-', 3: '-', 4: '-', 5: '-', 6: '-', 7: '-', 8: '-' } 
        };
      }
      
      const record = att.records.find(r => r.student.toString() === student._id.toString());
      if (record) {
        grouped[att.date].periods[att.period] = record.status === 'Present' ? 'P' : (record.status === 'Absent' ? 'A' : 'L');
      }
    });
    
    const result = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-portal/materials
router.get('/materials', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student;

    const Material = require('../models/Material');
    const materials = await Material.find({
      standard: student.standard,
      section: student.section
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Error fetching student materials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// POST /api/student-portal/feedback
router.post('/feedback', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student || req.user;
    const studentId = student?._id || student?.id || req.studentId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Student identity could not be verified'
      });
    }

    const { type, message, voiceData } = req.body;

    if (!type || !['text', 'voice'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback type. Must be "text" or "voice".'
      });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day TTL

    const feedbackData = {
      studentId,
      type,
      createdAt,
      expiresAt
    };

    if (type === 'text') {
      const trimmedMessage = String(message || '').trim();
      if (!trimmedMessage || trimmedMessage.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your feedback.'
        });
      }
      if (trimmedMessage.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Feedback cannot exceed 1000 characters.'
        });
      }
      feedbackData.message = trimmedMessage;
      feedbackData.voiceData = null;
    } else if (type === 'voice') {
      if (!voiceData || typeof voiceData !== 'string' || voiceData.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Voice recording data is required.'
        });
      }

      // Check Base64 payload size (maximum 5 MB binary data)
      const base64Data = voiceData.includes('base64,') ? voiceData.split('base64,')[1] : voiceData;
      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

      if (sizeInBytes > maxSizeBytes) {
        return res.status(400).json({
          success: false,
          message: 'Voice recording is too large.'
        });
      }

      feedbackData.message = null;
      feedbackData.voiceData = voiceData;
    }

    const feedback = new StudentFeedback(feedbackData);
    await feedback.save();

    return res.status(201).json({
      success: true,
      message: type === 'voice' ? 'Voice feedback sent successfully.' : 'Feedback sent successfully.'
    });
  } catch (error) {
    console.error('Student feedback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to send feedback. Please try again.'
    });
  }
});

module.exports = router;
