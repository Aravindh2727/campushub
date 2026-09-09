const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/report', attendanceController.getAttendanceReport);
router.get('/export', attendanceController.exportDailyAttendance);
router.post('/bulk', attendanceController.bulkImportDailyAttendance);
router.get('/summary', attendanceController.getAttendanceSummary);
router.get('/', attendanceController.getAttendance);
router.post('/', attendanceController.saveAttendance);
router.delete('/', attendanceController.deleteAttendance);

module.exports = router;
