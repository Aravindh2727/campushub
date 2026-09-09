const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    const { date, standard, section } = req.query;
    let att = readCollection('attendances');

    // Teacher Role check
    if (req.dbUser && req.dbUser.role === 'teacher') {
        const assigned = req.dbUser.assignedClasses || [];
        att = att.filter(a => assigned.some(cls => cls.standard === a.standard && cls.section === a.section));
    }

    if (date) {
        // match YYYY-MM-DD part
        att = att.filter(a => a.date && a.date.startsWith(date));
    }
    if (standard && standard !== 'All') att = att.filter(a => a.standard === standard);
    if (section && section !== 'All') att = att.filter(a => a.section === section);
    res.json({ success: true, data: att });
});

router.post('/', (req, res) => {
    const { standard, section, date, records } = req.body;
    const attendances = readCollection('attendances');
    
    const existingIndex = attendances.findIndex(a => a.standard === standard && a.section === section && a.date && a.date.startsWith(date.split('T')[0]));
    
    if (existingIndex > -1) {
        attendances[existingIndex].records = records;
        writeCollection('attendances', attendances);
        res.json({ success: true, data: attendances[existingIndex] });
    } else {
        const newAtt = {
            _id: 'ATT-' + uuidv4(),
            standard,
            section,
            date,
            records,
            markedBy: req.user ? req.user.uid : 'U-ADMIN'
        };
        attendances.push(newAtt);
        writeCollection('attendances', attendances);
        res.json({ success: true, data: newAtt });
    }
});

router.get('/summary', (req, res) => {
    const { date, standard, section } = req.query;
    let att = readCollection('attendances');
    
    // Teacher Role check
    if (req.dbUser && req.dbUser.role === 'teacher') {
        const assigned = req.dbUser.assignedClasses || [];
        att = att.filter(a => assigned.some(cls => cls.standard === a.standard && cls.section === a.section));
    }

    if (date) att = att.filter(a => a.date && a.date.startsWith(date));
    if (standard && standard !== 'All') att = att.filter(a => a.standard === standard);
    if (section && section !== 'All') att = att.filter(a => a.section === section);
    
    const summary = att.map(a => ({
        classId: `${a.standard}-${a.section}`,
        standard: a.standard,
        section: a.section,
        totalStudents: a.records.length,
        presentCount: a.records.filter(r => r.status === 'Present').length,
        absentCount: a.records.filter(r => r.status === 'Absent').length,
        markedBy: a.markedBy
    }));
    res.json({ success: true, data: summary });
});

router.delete('/', (req, res) => {
    const { standard, section, date } = req.query;
    let att = readCollection('attendances');
    att = att.filter(a => !(a.standard === standard && a.section === section && a.date && a.date.startsWith(date.split('T')[0])));
    writeCollection('attendances', att);
    res.json({ success: true });
});

router.post('/bulk', (req, res) => {
    const records = req.body;
    let attendances = readCollection('attendances');
    records.forEach(record => {
        const existingIndex = attendances.findIndex(a => a.standard === record.standard && a.section === record.section && a.date && a.date.startsWith(record.date.split('T')[0]));
        if (existingIndex > -1) {
            attendances[existingIndex].records = record.records;
        } else {
            attendances.push({
                _id: 'ATT-' + uuidv4(),
                ...record,
                markedBy: req.user ? req.user.uid : 'U-ADMIN'
            });
        }
    });
    writeCollection('attendances', attendances);
    res.json({ success: true });
});

router.get('/report', (req, res) => {
    const { standard, section, fromDate, toDate } = req.query;
    let att = readCollection('attendances');
    
    // Teacher Role check
    if (req.dbUser && req.dbUser.role === 'teacher') {
        const assigned = req.dbUser.assignedClasses || [];
        att = att.filter(a => assigned.some(cls => cls.standard === a.standard && cls.section === a.section));
    }

    if (standard && standard !== 'All') att = att.filter(a => a.standard === standard);
    if (section && section !== 'All') att = att.filter(a => a.section === section);
    if (fromDate && toDate) {
        att = att.filter(a => a.date >= fromDate && a.date <= toDate);
    }
    res.json({ success: true, data: att });
});

router.get('/export', (req, res) => {
    // Generate a static or simple JSON response to simulate export for the frontend
    const { standard, section, fromDate, toDate } = req.query;
    let att = readCollection('attendances');
    if (standard && standard !== 'All') att = att.filter(a => a.standard === standard);
    if (section && section !== 'All') att = att.filter(a => a.section === section);
    if (fromDate && toDate) {
        att = att.filter(a => a.date >= fromDate && a.date <= toDate);
    }
    
    const csvHeader = "Date,Standard,Section,Student ID,Status\\n";
    const csvRows = att.flatMap(a => a.records.map(r => `${a.date},${a.standard},${a.section},${r.studentId},${r.status}`)).join("\\n");
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_export.csv');
    res.send(csvHeader + csvRows);
});

module.exports = router;