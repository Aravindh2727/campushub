const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');

router.get('/', (req, res) => {
    const { standard, section } = req.query;
    let students = readCollection('students');
    
    // Teacher Role check
    if (req.dbUser && req.dbUser.role === 'teacher') {
        const assigned = req.dbUser.assignedClasses || [];
        students = students.filter(s => assigned.some(a => a.standard === s.standard && a.section === s.section));
    }

    if (standard && standard !== 'All') students = students.filter(s => s.standard === standard);
    if (section && section !== 'All') students = students.filter(s => s.section === section);
    res.json({ success: true, data: students });
});

router.get('/:id', (req, res) => {
    const students = readCollection('students');
    res.json(students.find(s => s._id === req.params.id) || {});
});

router.post('/', (req, res) => {
    const students = readCollection('students');
    const newStudent = { ...req.body, _id: 'S-' + req.body.emisNumber, terms: [] };
    students.push(newStudent);
    writeCollection('students', students);
    res.json({ success: true, data: newStudent });
});

router.put('/:id', (req, res) => {
    const students = readCollection('students');
    const index = students.findIndex(s => s._id === req.params.id);
    if (index > -1) {
        students[index] = { ...students[index], ...req.body };
        writeCollection('students', students);
        res.json({ success: true, data: students[index] });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

router.delete('/:id', (req, res) => {
    let students = readCollection('students');
    students = students.filter(s => s._id !== req.params.id);
    writeCollection('students', students);
    res.json({ success: true });
});

router.post('/bulk', (req, res) => {
    const students = readCollection('students');
    const newStudents = req.body.map(s => ({ ...s, _id: 'S-' + s.emisNumber, terms: [] }));
    writeCollection('students', [...students, ...newStudents]);
    res.json({ success: true, count: newStudents.length });
});

router.post('/bulk-marks', (req, res) => {
    const { termName, records } = req.body;
    let students = readCollection('students');
    records.forEach(record => {
        const index = students.findIndex(s => s._id === record.studentId);
        if (index > -1) {
            let terms = students[index].terms || [];
            const termIndex = terms.findIndex(t => t.termName === termName);
            if (termIndex > -1) terms[termIndex].marks = record.marks;
            else terms.push({ termName, marks: record.marks });
            students[index].terms = terms;
        }
    });
    writeCollection('students', students);
    res.json({ success: true });
});

router.post('/bulk-marks-universal', (req, res) => {
    const { termName, records } = req.body;
    let students = readCollection('students');
    records.forEach(record => {
        const index = students.findIndex(s => s._id === record.studentId);
        if (index > -1) {
            let terms = students[index].terms || [];
            const termIndex = terms.findIndex(t => t.termName === termName);
            if (termIndex > -1) terms[termIndex].marks = record.marks;
            else terms.push({ termName, marks: record.marks });
            students[index].terms = terms;
        }
    });
    writeCollection('students', students);
    res.json({ success: true });
});

router.post('/bulk-delete', (req, res) => {
    const { studentIds } = req.body;
    let students = readCollection('students');
    students = students.filter(s => !studentIds.includes(s._id));
    writeCollection('students', students);
    res.json({ success: true });
});

router.put('/:id/marks', (req, res) => {
    const { termName, marks } = req.body;
    const students = readCollection('students');
    const index = students.findIndex(s => s._id === req.params.id);
    if (index > -1) {
        let terms = students[index].terms || [];
        const termIndex = terms.findIndex(t => t.termName === termName);
        if (termIndex > -1) terms[termIndex].marks = marks;
        else terms.push({ termName, marks });
        students[index].terms = terms;
        writeCollection('students', students);
        res.json({ success: true, data: students[index] });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

module.exports = router;