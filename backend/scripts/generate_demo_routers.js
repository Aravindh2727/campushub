const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'demo', 'routes');
if (!fs.existsSync(routesDir)) {
    fs.mkdirSync(routesDir, { recursive: true });
}

const routers = [
    {
        name: 'authDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');

router.post('/demo-login', (req, res) => {
    const { email, password } = req.body;
    if (password !== 'Demo@123') {
        return res.status(401).json({ error: 'Invalid demo credentials' });
    }
    const users = readCollection('users');
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ error: 'Demo user not found' });
    }
    
    // Create JWT
    const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, 'DEMO_SECRET_KEY', { expiresIn: '24h' });
    res.json({ token, user });
});

router.get('/me', (req, res) => {
    const users = readCollection('users');
    const user = users.find(u => u.uid === req.user.uid);
    res.json({ success: true, data: user });
});

router.get('/check-role', (req, res) => {
    const users = readCollection('users');
    const user = users.find(u => u.uid === req.user.uid);
    res.json({ role: user.role });
});

router.get('/users', (req, res) => {
    res.json({ success: true, data: readCollection('users') });
});

module.exports = router;`
    },
    {
        name: 'studentPortalDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { readCollection } = require('../demoDataService');

router.post('/login', (req, res) => {
    const { emisNumber, dob } = req.body;
    const students = readCollection('students');
    const student = students.find(s => s.emisNumber === emisNumber);
    
    // Simple check. Real login requires strict dob. For demo, we just verify it matches the JSON string format "YYYY-MM-DD" or similar
    if (!student) {
        return res.status(404).json({ error: 'Student not found in demo data' });
    }
    if (student.dob !== dob) {
        return res.status(401).json({ error: 'Incorrect DOB for demo student' });
    }
    
    const token = jwt.sign({ studentId: student._id, emisNumber: student.emisNumber, role: 'student' }, 'DEMO_STUDENT_SECRET', { expiresIn: '24h' });
    res.json({ success: true, token, student });
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
    const myAtt = attendances.map(a => {
        const rec = a.records.find(r => r.studentId === req.student.studentId);
        if (rec) {
            return { date: a.date, status: rec.status };
        }
        return null;
    }).filter(Boolean);
    res.json({ success: true, data: myAtt });
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

module.exports = router;`
    },
    {
        name: 'studentDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');

router.get('/', (req, res) => {
    const { standard, section } = req.query;
    let students = readCollection('students');
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

module.exports = router;`
    },
    {
        name: 'analyticsDemoRouter.js',
        content: `const express = require('express');
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

module.exports = router;`
    },
    {
        name: 'classDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');

router.get('/', (req, res) => {
    res.json({ success: true, data: readCollection('classconfigs') });
});

module.exports = router;`
    },
    {
        name: 'attendanceDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    const { date, standard, section } = req.query;
    let att = readCollection('attendances');
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

module.exports = router;`
    },
    {
        name: 'homeworkDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.json({ success: true, data: readCollection('homeworks') });
});

router.post('/', (req, res) => {
    const hw = readCollection('homeworks');
    const newItem = { ...req.body, _id: 'HW-' + uuidv4(), date: new Date().toISOString() };
    hw.push(newItem);
    writeCollection('homeworks', hw);
    res.json({ success: true, data: newItem });
});

module.exports = router;`
    },
    {
        name: 'circularDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.json({ success: true, data: readCollection('circulars') });
});

router.post('/', (req, res) => {
    const items = readCollection('circulars');
    const newItem = { ...req.body, _id: 'CIR-' + uuidv4(), date: new Date().toISOString() };
    items.push(newItem);
    writeCollection('circulars', items);
    res.json({ success: true, data: newItem });
});

module.exports = router;`
    },
    {
        name: 'materialDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.json({ success: true, data: readCollection('materials') });
});

router.post('/', (req, res) => {
    const items = readCollection('materials');
    const newItem = { ...req.body, _id: 'MAT-' + uuidv4(), createdAt: new Date().toISOString() };
    items.push(newItem);
    writeCollection('materials', items);
    res.json({ success: true, data: newItem });
});

module.exports = router;`
    },
    {
        name: 'feedbackDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');

router.get('/', (req, res) => {
    res.json({ success: true, data: readCollection('feedbacks') });
});

module.exports = router;`
    },
    {
        name: 'aiDemoRouter.js',
        content: `const express = require('express');
const router = express.Router();

router.post('/ask', (req, res) => {
    res.json({ success: true, answer: 'This is a mocked AI response for the offline demo mode.' });
});

module.exports = router;`
    }
];

routers.forEach(r => {
    fs.writeFileSync(path.join(routesDir, r.name), r.content);
});

console.log('Demo sub-routers generated successfully.');
