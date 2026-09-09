const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { readCollection } = require('../demoDataService');

router.post('/login', (req, res) => {
    const { identifier } = req.body;
    const students = readCollection('students');
    
    // Check if the identifier matches an EMIS number or something.
    // For demo, we'll assume identifier matches emisNumber.
    const student = students.find(s => s.emisNumber === identifier);
    
    if (!student) {
        return res.status(404).json({ message: 'Student account not found in demo data' });
    }
    
    res.json({
      requiresPassword: true,
      studentId: student._id,
      studentName: student.name
    });
});

router.post('/login-verify', (req, res) => {
    const { studentId, password } = req.body;
    const students = readCollection('students');
    const student = students.find(s => s._id === studentId);
    
    if (!student) {
        return res.status(404).json({ message: 'Student account not found' });
    }
    
    // In demo mode, we just let them in if password matches the standard format "15052012"
    // Since the actual dob in demo data might be "2012-05-15", we'll just check if it matches the string 
    // or just let the default password "15052012" work for all demo students to simplify demoing.
    if (password !== '15052012') {
        return res.status(401).json({ message: 'Incorrect password for demo. Use: 15052012' });
    }
    
    const activeStudentId = student._id.toString();
    const linkedAccounts = [{
      studentId: activeStudentId,
      name: student.name,
      standard: student.standard,
      section: student.section,
      emisNumber: student.emisNumber
    }];

    const token = jwt.sign(
      { activeStudentId, linkedAccounts, studentId: student._id, emisNumber: student.emisNumber, role: 'student' },
      'DEMO_STUDENT_SECRET',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      student
    });
});

const studentAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const token = authHeader.split(' ')[1];
        req.student = jwt.verify(token, 'DEMO_STUDENT_SECRET');
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid Token' });
    }
};

router.get('/me', studentAuth, (req, res) => {
    const students = readCollection('students');
    const student = students.find(s => s._id === req.student.studentId);
    res.json({ success: true, data: student });
});

router.get('/attendance', studentAuth, (req, res) => {
    const attendances = readCollection('attendances');
    const grouped = {};
    
    attendances.forEach(a => {
        if (!grouped[a.date]) {
            grouped[a.date] = {
                date: a.date,
                periods: { 1: '-', 2: '-', 3: '-', 4: '-', 5: '-', 6: '-', 7: '-', 8: '-' }
            };
        }
        // Demo data uses `studentId` instead of `student._id` mostly
        const rec = a.records.find(r => r.studentId === req.student.studentId || r.student === req.student.studentId);
        if (rec) {
            grouped[a.date].periods[a.period] = rec.status === 'Present' ? 'P' : (rec.status === 'Absent' ? 'A' : 'L');
        }
    });
    
    const result = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
    res.json({ success: true, data: result });
});

router.get('/homework', studentAuth, (req, res) => {
    const hws = readCollection('homeworks');
    const student = readCollection('students').find(s => s._id === req.student.studentId);
    const myHw = hws.filter(h => h.standard === student.standard && h.section === student.section);
    res.json({ success: true, data: myHw });
});

router.get('/circulars', studentAuth, (req, res) => {
    const circulars = readCollection('circulars');
    res.json({ success: true, data: circulars.filter(c => c.targetAudience === 'All' || c.targetAudience === 'Students') });
});

router.get('/materials', studentAuth, (req, res) => {
    const materials = readCollection('materials');
    const student = readCollection('students').find(s => s._id === req.student.studentId);
    res.json({ success: true, data: materials.filter(m => m.standard === student.standard && m.section === student.section) });
});

module.exports = router;