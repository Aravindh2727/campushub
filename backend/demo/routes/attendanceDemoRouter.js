const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    const { date, standard, section, period, attendanceType = 'period' } = req.query;
    let att = readCollection('attendances');

    // Teacher Role check
    if (req.dbUser && req.dbUser.role === 'teacher') {
        const assigned = req.dbUser.assignedClasses || [];
        att = att.filter(a => assigned.some(cls => cls.standard === a.standard && cls.section === a.section));
    }

    if (date) {
        att = att.filter(a => a.date === date);
    }
    if (standard && standard !== 'All') att = att.filter(a => a.standard === standard);
    if (section && section !== 'All') att = att.filter(a => a.section === section);
    if (attendanceType) att = att.filter(a => a.attendanceType === attendanceType);
    if (attendanceType === 'period' && period) att = att.filter(a => String(a.period) === String(period));

    if (att.length > 0) {
        res.json(att[0]);
    } else {
        res.json({ records: [], isSubmitted: false });
    }
});

router.post('/', (req, res) => {
    const { standard, section, date, records, attendanceType = 'period', period, isSubmitted } = req.body;
    const attendances = readCollection('attendances');
    
    const existingIndex = attendances.findIndex(a => 
        a.standard === standard && 
        a.section === section && 
        a.date === date &&
        a.attendanceType === attendanceType &&
        (attendanceType !== 'period' || String(a.period) === String(period))
    );
    
    if (existingIndex > -1) {
        attendances[existingIndex].records = records;
        if (isSubmitted !== undefined) attendances[existingIndex].isSubmitted = isSubmitted;
        writeCollection('attendances', attendances);
        res.json({ success: true, data: attendances[existingIndex] });
    } else {
        const newAtt = {
            _id: 'ATT-' + uuidv4(),
            standard,
            section,
            date,
            attendanceType,
            period: attendanceType === 'period' ? Number(period) : null,
            records,
            isSubmitted: isSubmitted || false,
            markedBy: req.user ? req.user.uid : 'U-ADMIN'
        };
        attendances.push(newAtt);
        writeCollection('attendances', attendances);
        res.json({ success: true, data: newAtt });
    }
});

router.get('/summary', (req, res) => {
    const { date, standard, section } = req.query;
    
    let students = readCollection('students');
    students = students.filter(s => s.standard === standard && s.section === section);

    let att = readCollection('attendances');
    // Filter attendances for the given date, standard, section
    if (date) att = att.filter(a => a.date === date);
    if (standard && standard !== 'All') att = att.filter(a => a.standard === standard);
    if (section && section !== 'All') att = att.filter(a => a.section === section);
    
    // In production we only summarize submitted attendance
    att = att.filter(a => a.isSubmitted === true);

    const summaryMap = {};
    students.forEach(s => {
        summaryMap[s._id] = {
            _id: s._id,
            name: s.name,
            emisNumber: s.emisNumber,
            daily: '-',
            periods: { 1: '-', 2: '-', 3: '-', 4: '-', 5: '-', 6: '-', 7: '-', 8: '-' }
        };
    });

    att.forEach(a => {
        if (a.records) {
            a.records.forEach(r => {
                const stuId = r.student ? (r.student._id || r.student) : r.studentId;
                if (summaryMap[stuId]) {
                    const statusChar = r.status === 'Present' ? 'P' : (r.status === 'Absent' ? 'A' : 'L');
                    if (a.attendanceType === 'daily') {
                        summaryMap[stuId].daily = statusChar;
                    } else if (a.attendanceType === 'period') {
                        summaryMap[stuId].periods[a.period] = statusChar;
                    }
                }
            });
        }
    });

    res.json(Object.values(summaryMap));
});

router.delete('/', (req, res) => {
    const { standard, section, date, attendanceType = 'period', period } = req.query;
    let att = readCollection('attendances');
    att = att.filter(a => !(
        a.standard === standard && 
        a.section === section && 
        a.date === date &&
        a.attendanceType === attendanceType &&
        (attendanceType !== 'period' || String(a.period) === String(period))
    ));
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