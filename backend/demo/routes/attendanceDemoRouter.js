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
    const { standard, section, fromDate, toDate, percentage } = req.query;
    let att = readCollection('attendances');
    let students = readCollection('students');
    
    // Teacher Role check
    if (req.dbUser && req.dbUser.role === 'teacher') {
        const assigned = req.dbUser.assignedClasses || [];
        att = att.filter(a => assigned.some(cls => cls.standard === a.standard && cls.section === a.section));
        students = students.filter(s => assigned.some(cls => cls.standard === s.standard && cls.section === s.section));
    }

    // Filter attendances (daily, submitted)
    att = att.filter(a => a.attendanceType === 'daily' && a.isSubmitted === true);

    if (standard && standard !== 'All') {
        att = att.filter(a => a.standard === standard);
        students = students.filter(s => s.standard === standard);
    }
    if (section && section !== 'All') {
        att = att.filter(a => a.section === section);
        students = students.filter(s => s.section === section);
    }
    if (fromDate) att = att.filter(a => a.date >= fromDate);
    if (toDate) att = att.filter(a => a.date <= toDate);

    // Build the report map for each student
    const reportMap = {};
    students.forEach(s => {
        reportMap[s._id] = {
            studentId: s._id,
            emisNumber: s.emisNumber,
            name: s.name,
            standard: s.standard,
            section: s.section,
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            percentage: 0
        };
    });

    att.forEach(a => {
        if (a.records) {
            a.records.forEach(r => {
                const sId = r.student ? (r.student._id || r.student) : r.studentId;
                if (reportMap[sId]) {
                    reportMap[sId].totalDays += 1;
                    if (r.status === 'Present') {
                        reportMap[sId].presentDays += 1;
                    } else {
                        reportMap[sId].absentDays += 1;
                    }
                }
            });
        }
    });

    let reportArray = Object.values(reportMap);
    reportArray.forEach(row => {
        if (row.totalDays > 0) {
            row.percentage = Math.round((row.presentDays / row.totalDays) * 100);
        } else {
            row.percentage = 0;
        }
    });

    if (percentage && percentage !== 'All') {
        if (percentage === '90% and Above') {
            reportArray = reportArray.filter(r => r.percentage >= 90);
        } else if (percentage === '80%–89%') {
            reportArray = reportArray.filter(r => r.percentage >= 80 && r.percentage < 90);
        } else if (percentage === '75%–79%') {
            reportArray = reportArray.filter(r => r.percentage >= 75 && r.percentage < 80);
        } else if (percentage === 'Below 75%') {
            reportArray = reportArray.filter(r => r.percentage < 75);
        }
    }

    reportArray.sort((a, b) => {
        if (a.standard !== b.standard) return parseInt(a.standard) - parseInt(b.standard);
        if (a.section !== b.section) return (a.section || '').localeCompare(b.section || '');
        return (a.name || '').localeCompare(b.name || '');
    });

    res.json({ success: true, data: reportArray });
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