const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Sub-routers
const authDemoRouter = require('./routes/authDemoRouter');
const studentDemoRouter = require('./routes/studentDemoRouter');
const studentPortalDemoRouter = require('./routes/studentPortalDemoRouter');
const analyticsDemoRouter = require('./routes/analyticsDemoRouter');
const classDemoRouter = require('./routes/classDemoRouter');
const attendanceDemoRouter = require('./routes/attendanceDemoRouter');
const homeworkDemoRouter = require('./routes/homeworkDemoRouter');
const circularDemoRouter = require('./routes/circularDemoRouter');
const materialDemoRouter = require('./routes/materialDemoRouter');
const feedbackDemoRouter = require('./routes/feedbackDemoRouter');
const aiDemoRouter = require('./routes/aiDemoRouter');

const { demoAuthMiddleware } = require('./demoAuthMiddleware');

// Map sub-routers to intercept existing endpoint paths
router.use('/auth', authDemoRouter);
router.use('/student-portal', studentPortalDemoRouter);

// Apply auth middleware to protected routes
router.use('/classes', classDemoRouter); // Unprotected in production
router.use('/students', demoAuthMiddleware, studentDemoRouter);
router.use('/analytics', demoAuthMiddleware, analyticsDemoRouter);
router.use('/attendance', demoAuthMiddleware, attendanceDemoRouter);
router.use('/homework', demoAuthMiddleware, homeworkDemoRouter);
router.use('/circulars', demoAuthMiddleware, circularDemoRouter);
router.use('/materials', demoAuthMiddleware, materialDemoRouter);
router.use('/feedback', demoAuthMiddleware, feedbackDemoRouter);
router.use('/ai', demoAuthMiddleware, aiDemoRouter);

module.exports = router;
