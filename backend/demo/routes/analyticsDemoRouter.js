const express = require('express');
const router = express.Router();
const { readCollection } = require('../demoDataService');

router.get('/dashboard', (req, res) => {
    const students = readCollection('students');
    const teachers = readCollection('users').filter(u => u.role === 'teacher');
    
    let filteredStudents = students;
    if (req.dbUser && req.dbUser.role === 'teacher') {
        const assigned = req.dbUser.assignedClasses || [];
        if (assigned.length > 0) {
            filteredStudents = students.filter(s => assigned.some(c => c.standard === s.standard && c.section === s.section));
        } else {
            filteredStudents = [];
        }
    }

    const totalStudents = filteredStudents.length;
    const maleStudents = filteredStudents.filter(s => s.gender === 'Male').length;
    const femaleStudents = filteredStudents.filter(s => s.gender === 'Female').length;
    const totalTeachers = teachers.length;

    const classConfigs = readCollection('classconfigs');

    // Helper to calculate total marks and percentage
    const processStudents = (stList) => {
        return stList.map(s => {
            const config = classConfigs.find(c => c.standard === s.standard && c.section === s.section);
            const expectedSubjects = config && config.subjects && config.subjects.length > 0 
                ? config.subjects.length 
                : (['11', '12'].includes(s.standard) ? 6 : 5);
            
            const maxMarksPerExam = expectedSubjects * 100;
            
            let totalMarks = 0;
            let maximumMarks = 0;
            const processedTerms = [];

            if (s.terms) {
                const uniqueTerms = {};
                s.terms.forEach(t => {
                    if (!uniqueTerms[t.termName]) {
                        let termScore = 0;
                        if (t.marks) {
                            t.marks.forEach(m => {
                                termScore += Number(m.score) || 0;
                            });
                        }
                        
                        const termPercentage = Math.round((termScore / maxMarksPerExam) * 10000) / 100;
                        uniqueTerms[t.termName] = {
                            termName: t.termName,
                            topScore: termScore, // 'topScore' used for compatibility with frontend expectation
                            maximumMarks: maxMarksPerExam,
                            percentage: termPercentage
                        };
                        
                        totalMarks += termScore;
                        maximumMarks += maxMarksPerExam;
                    }
                });
                processedTerms.push(...Object.values(uniqueTerms));
            }

            if (maximumMarks === 0) {
                maximumMarks = maxMarksPerExam; // Fallback
            }

            const percentage = Math.round((totalMarks / maximumMarks) * 10000) / 100;
            const genderPriority = s.gender === 'Male' ? 1 : (s.gender === 'Female' ? 2 : 3);
            
            return {
                _id: s._id,
                emisNumber: s.emisNumber,
                name: s.name,
                standard: s.standard,
                section: s.section,
                gender: s.gender,
                totalMarks,
                maximumMarks,
                percentage,
                genderPriority,
                processedTerms
            };
        }).filter(s => ['6','7','8','9','10','11','12'].includes(s.standard));
    };

    let processedStudents = processStudents(filteredStudents);

    const sorter = (a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        if (b.totalMarks !== a.totalMarks) return b.totalMarks - a.totalMarks;
        if (a.genderPriority !== b.genderPriority) return a.genderPriority - b.genderPriority;
        return (a.name || '').localeCompare(b.name || '');
    };

    const topStudents = [...processedStudents].sort(sorter).slice(0, 3);
    const top12Students = processedStudents.filter(s => s.standard === '12').sort(sorter).slice(0, 3);
    const top10Students = processedStudents.filter(s => s.standard === '10').sort(sorter).slice(0, 3);

    const abstractMap = {};
    filteredStudents.forEach(s => {
        const key = `${s.standard}-${s.section}`;
        if (!abstractMap[key]) {
            abstractMap[key] = {
                _id: { standard: s.standard, section: s.section },
                totalStudents: 0,
                maleStudents: 0,
                femaleStudents: 0
            };
        }
        abstractMap[key].totalStudents++;
        if (s.gender === 'Male') abstractMap[key].maleStudents++;
        if (s.gender === 'Female') abstractMap[key].femaleStudents++;
    });
    const studentsAbstract = Object.values(abstractMap).sort((a, b) => {
        const standardA = parseInt(a._id.standard) || 999;
        const standardB = parseInt(b._id.standard) || 999;
        if (standardA !== standardB) return standardA - standardB;
        return (a._id.section || '').localeCompare(b._id.section || '');
    });

    const classTermMap = {};
    processedStudents.forEach(s => {
        s.processedTerms.forEach(t => {
            const key = `${s.standard}-${s.section}-${t.termName}`;
            // Use percentage to determine the topper, fallback to topScore
            const isTopper = !classTermMap[key] || 
                             t.percentage > classTermMap[key].percentage || 
                             (t.percentage === classTermMap[key].percentage && t.topScore > classTermMap[key].topScore);
            
            if (isTopper) {
                classTermMap[key] = {
                    _id: { standard: s.standard, section: s.section, termName: t.termName },
                    studentId: s._id,
                    topStudent: s.name,
                    topScore: t.topScore,
                    maximumMarks: t.maximumMarks,
                    percentage: t.percentage
                };
            }
        });
    });
    const classwiseFirstMarks = Object.values(classTermMap).sort((a, b) => {
        const standardA = parseInt(a._id.standard) || 999;
        const standardB = parseInt(b._id.standard) || 999;
        if (standardA !== standardB) return standardA - standardB;
        if (a._id.section !== b._id.section) return (a._id.section || '').localeCompare(b._id.section || '');
        return (a._id.termName || '').localeCompare(b._id.termName || '');
    });

    const classAllMap = {};
    processedStudents.forEach(s => {
        if (s.maximumMarks > 0) {
            const key = `${s.standard}-${s.section}`;
            const isTopper = !classAllMap[key] || 
                             s.percentage > classAllMap[key].percentage || 
                             (s.percentage === classAllMap[key].percentage && s.totalMarks > classAllMap[key].topScore);

            if (isTopper) {
                classAllMap[key] = {
                    _id: { standard: s.standard, section: s.section },
                    studentId: s._id,
                    topStudent: s.name,
                    topScore: s.totalMarks,
                    maximumMarks: s.maximumMarks,
                    percentage: s.percentage
                };
            }
        }
    });
    const allExamsFirstMarks = Object.values(classAllMap).sort((a, b) => {
        const standardA = parseInt(a._id.standard) || 999;
        const standardB = parseInt(b._id.standard) || 999;
        if (standardA !== standardB) return standardA - standardB;
        return (a._id.section || '').localeCompare(b._id.section || '');
    });

    res.json({
        success: true,
        data: {
            totalStudents,
            maleStudents,
            femaleStudents,
            totalTeachers,
            topStudents,
            top12Students,
            top10Students,
            studentsAbstract,
            classwiseFirstMarks,
            allExamsFirstMarks
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