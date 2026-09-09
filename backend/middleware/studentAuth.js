const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const verifyStudentToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'edupulse_student_secret_key_2026';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Support both old { studentId } and new { activeStudentId, linkedAccounts } structures
    const currentStudentId = decoded.activeStudentId || decoded.studentId;

    const student = await Student.findById(currentStudentId);
    if (!student) {
      return res.status(401).json({ error: 'Unauthorized: Student not found' });
    }
    
    req.student = student;
    req.user = student;
    req.studentId = student._id;
    req.decodedToken = decoded;
    next();
  } catch (error) {
    console.error('Student token verification error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};

module.exports = { verifyStudentToken };
