const express = require('express');
const router = express.Router();
const { readCollection } = require('../demoDataService');

router.get('/dashboard', (req, res) => {
    const students = readCollection('students');
    const teachers = readCollection('users').filter(u => u.role === 'teacher');
    
    let totalStudents = students.length;
    let totalTeachers = teachers.length;
    
    // Simulate some logic for active class config
    
    res.json({
        success: true,
        data: {
            totalStudents,
            totalTeachers,
            attendanceRate: 95,
            recentActivities: [
                { type: 'Homework', message: 'Demo Math Homework Added', time: new Date().toISOString() },
                { type: 'Circular', message: 'Demo Sports Day Circular Added', time: new Date().toISOString() }
            ]
        }
    });
});

router.get('/leaderboard', (req, res) => {
    const students = readCollection('students');
    const { standard, section } = req.query;
    
    let filtered = students;
    if (standard && standard !== 'All') filtered = filtered.filter(s => s.standard === standard);
    if (section && section !== 'All') filtered = filtered.filter(s => s.section === section);
    
    const leaderboard = filtered.map(s => {
        let totalMarks = 0;
        if (s.terms) {
            s.terms.forEach(t => {
                if (t.marks) {
                    t.marks.forEach(m => {
                        totalMarks += m.score || 0;
                    });
                }
            });
        }
        return { ...s, totalMarks };
    });
    
    leaderboard.sort((a, b) => b.totalMarks - a.totalMarks);
    leaderboard.forEach((s, index) => {
        s.rank = index + 1;
    });
    
    res.json({ success: true, data: leaderboard });
});

module.exports = router;