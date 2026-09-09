const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const templateDir = path.join(__dirname, '..', 'demo-data-template');
if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
}

// Fixed UUIDs for determinism
const class6AId = 'cls-6a';
const class6BId = 'cls-6b';
const class7AId = 'cls-7a';
const class8AId = 'cls-8a';
const class9AId = 'cls-9a';
const class10AId = 'cls-10a';
const class11AId = 'cls-11a';
const class12AId = 'cls-12a';

// 1. Classes
const classes = [
    { _id: class6AId, standard: '6', section: 'A', stream: 'General', group: '', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], classTeacher: 'T001' },
    { _id: class6BId, standard: '6', section: 'B', stream: 'General', group: '', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], classTeacher: 'T002' },
    { _id: class7AId, standard: '7', section: 'A', stream: 'General', group: '', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], classTeacher: 'T003' },
    { _id: class8AId, standard: '8', section: 'A', stream: 'General', group: '', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], classTeacher: 'T004' },
    { _id: class9AId, standard: '9', section: 'A', stream: 'General', group: '', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], classTeacher: 'T005' },
    { _id: class10AId, standard: '10', section: 'A', stream: 'General', group: '', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], classTeacher: 'T006' },
    { _id: class11AId, standard: '11', section: 'A', stream: 'HSC', group: 'Bio-Maths', subjects: ['Tamil', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology'], classTeacher: 'T007' },
    { _id: class12AId, standard: '12', section: 'A', stream: 'HSC', group: 'Computer Science', subjects: ['Tamil', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science'], classTeacher: 'T008' }
];
fs.writeFileSync(path.join(templateDir, 'classconfigs.json'), JSON.stringify(classes, null, 2));

// 2. Users (Admin, Teachers)
const users = [
    { _id: 'U-ADMIN', uid: 'demo-admin-uid', role: 'admin', email: 'admin@demo.com', name: 'Demo Admin', isActive: true },
    { _id: 'T001', uid: 'demo-teacher-001', role: 'teacher', email: 'teacher@demo.com', name: 'Sarah Connor', isActive: true, assignedClasses: [{ standard: '6', section: 'A', subject: 'English', accessLevel: 'edit' }, { standard: '6', section: 'B', subject: 'English', accessLevel: 'edit' }] },
    { _id: 'T002', uid: 'demo-teacher-002', role: 'teacher', email: 'maths.teacher@demo.com', name: 'Alan Turing', isActive: true, assignedClasses: [{ standard: '6', section: 'B', subject: 'Mathematics', accessLevel: 'edit' }, { standard: '7', section: 'A', subject: 'Mathematics', accessLevel: 'edit' }] },
    { _id: 'T003', uid: 'demo-teacher-003', role: 'teacher', email: 'science.teacher@demo.com', name: 'Marie Curie', isActive: true, assignedClasses: [{ standard: '7', section: 'A', subject: 'Science', accessLevel: 'edit' }, { standard: '8', section: 'A', subject: 'Science', accessLevel: 'edit' }] },
    { _id: 'T004', uid: 'demo-teacher-004', role: 'teacher', email: 'history.teacher@demo.com', name: 'Herodotus', isActive: true, assignedClasses: [{ standard: '8', section: 'A', subject: 'Social Science', accessLevel: 'edit' }, { standard: '9', section: 'A', subject: 'Social Science', accessLevel: 'edit' }] },
    { _id: 'T005', uid: 'demo-teacher-005', role: 'teacher', email: 'tamil.teacher@demo.com', name: 'Thiruvalluvar', isActive: true, assignedClasses: [{ standard: '9', section: 'A', subject: 'Tamil', accessLevel: 'edit' }, { standard: '10', section: 'A', subject: 'Tamil', accessLevel: 'edit' }] },
    { _id: 'T006', uid: 'demo-teacher-006', role: 'teacher', email: 'physics.teacher@demo.com', name: 'Albert Einstein', isActive: true, assignedClasses: [{ standard: '10', section: 'A', subject: 'Science', accessLevel: 'edit' }, { standard: '11', section: 'A', subject: 'Physics', accessLevel: 'edit' }] },
    { _id: 'T007', uid: 'demo-teacher-007', role: 'teacher', email: 'bio.teacher@demo.com', name: 'Charles Darwin', isActive: true, assignedClasses: [{ standard: '11', section: 'A', subject: 'Biology', accessLevel: 'edit' }, { standard: '12', section: 'A', subject: 'Biology', accessLevel: 'edit' }] },
    { _id: 'T008', uid: 'demo-teacher-008', role: 'teacher', email: 'cs.teacher@demo.com', name: 'Ada Lovelace', isActive: true, assignedClasses: [{ standard: '12', section: 'A', subject: 'Computer Science', accessLevel: 'edit' }] }
];
fs.writeFileSync(path.join(templateDir, 'users.json'), JSON.stringify(users, null, 2));

// 3. Students
const students = [];
let studentCount = 1;
// Generate Demo001 specifically
students.push({
    _id: `S-DEMO001`,
    emisNumber: `DEMO001`,
    name: `John Doe`,
    standard: '6',
    section: 'A',
    gender: 'Male',
    medium: 'English',
    dob: '15052012', // Matches DDMMYYYY for old DOB login style
    fatherName: 'Richard Doe',
    address: '123 Demo Street',
    mobileNumber: '9876543210',
    terms: []
});
studentCount++;

const generateStudents = (std, sec, count) => {
    for (let i = 0; i < count; i++) {
        const emis = `DEMO${studentCount.toString().padStart(3, '0')}`;
        students.push({
            _id: `S-${emis}`,
            emisNumber: emis,
            name: `Student ${emis}`,
            standard: std,
            section: sec,
            gender: i % 2 === 0 ? 'Male' : 'Female',
            medium: 'English',
            dob: '15052012',
            fatherName: `Father ${emis}`,
            mobileNumber: '9999999999',
            terms: [{
                termName: 'MidTerm 1',
                marks: [
                    { subject: 'Tamil', score: 75 + (i % 20) },
                    { subject: 'English', score: 80 + (i % 15) },
                    { subject: 'Mathematics', score: 85 + (i % 10) },
                    { subject: 'Science', score: 70 + (i % 20) },
                    { subject: 'Social Science', score: 90 - (i % 10) }
                ]
            }]
        });
        studentCount++;
    }
};

generateStudents('6', 'A', 14); // Total 15 in 6A
generateStudents('6', 'B', 15);
generateStudents('7', 'A', 15);
generateStudents('8', 'A', 15);
generateStudents('9', 'A', 15);
generateStudents('10', 'A', 15);
generateStudents('11', 'A', 15);
generateStudents('12', 'A', 15);

fs.writeFileSync(path.join(templateDir, 'students.json'), JSON.stringify(students, null, 2));

// 4. Attendance
const attendanceRecords = [];
const today = new Date();
for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    const dateStr = d.toISOString();
    
    // Create attendance for 6A
    const records6A = students.filter(s => s.standard === '6' && s.section === 'A').map((s, idx) => ({
        studentId: s._id,
        status: idx % 10 === 0 && i % 3 === 0 ? 'Absent' : 'Present'
    }));
    
    attendanceRecords.push({
        _id: `ATT-6A-${i}`,
        standard: '6',
        section: 'A',
        date: dateStr,
        markedBy: 'T001',
        records: records6A,
        createdAt: dateStr
    });
}
fs.writeFileSync(path.join(templateDir, 'attendances.json'), JSON.stringify(attendanceRecords, null, 2));

// 5. Homework
const homeworks = [
    { _id: 'HW001', standard: '6', section: 'A', subject: 'English', title: 'Write an essay on Climate Change', description: 'At least 500 words.', date: new Date().toISOString(), teacherId: 'T001' },
    { _id: 'HW002', standard: '6', section: 'A', subject: 'Mathematics', title: 'Algebra Exercises', description: 'Chapter 5, Q1 to Q10', date: new Date().toISOString(), teacherId: 'T002' },
    { _id: 'HW003', standard: '10', section: 'A', subject: 'Science', title: 'Periodic Table Revision', description: 'Memorize first 20 elements', date: new Date().toISOString(), teacherId: 'T006' }
];
fs.writeFileSync(path.join(templateDir, 'homeworks.json'), JSON.stringify(homeworks, null, 2));

// 6. Materials
const materials = [
    { _id: 'MAT001', standard: '6', section: 'A', subject: 'English', title: 'Grammar Notes - Nouns', type: 'document', url: 'https://example.com/demo.pdf', uploadedBy: 'T001', createdAt: new Date().toISOString() },
    { _id: 'MAT002', standard: '12', section: 'A', subject: 'Computer Science', title: 'Python Basics PPT', type: 'presentation', url: 'https://example.com/demo.ppt', uploadedBy: 'T008', createdAt: new Date().toISOString() }
];
fs.writeFileSync(path.join(templateDir, 'materials.json'), JSON.stringify(materials, null, 2));

// 7. Circulars
const circulars = [
    { _id: 'CIR001', title: 'Annual Sports Day 2026', content: 'The Annual Sports Day will be held next Friday. All students must participate.', date: new Date().toISOString(), targetAudience: 'All', author: 'U-ADMIN' },
    { _id: 'CIR002', title: 'Parent Teacher Meeting', content: 'PTM for Grade 6 to 8 is scheduled for Saturday.', date: new Date().toISOString(), targetAudience: 'Students', author: 'U-ADMIN' }
];
fs.writeFileSync(path.join(templateDir, 'circulars.json'), JSON.stringify(circulars, null, 2));

// 8. Feedback
const feedbacks = [
    { _id: 'FB001', category: 'Academic', priority: 'Medium', message: 'Need more practice sessions for Mathematics.', isAnonymous: false, studentId: 'S-DEMO001', emisNumber: 'DEMO001', studentName: 'John Doe', status: 'pending', createdAt: new Date().toISOString() }
];
fs.writeFileSync(path.join(templateDir, 'feedbacks.json'), JSON.stringify(feedbacks, null, 2));

console.log('Demo data templates generated successfully.');
