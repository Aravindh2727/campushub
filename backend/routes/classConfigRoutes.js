const express = require('express');
const router = express.Router();
const classConfigController = require('../controllers/classConfigController');

// All routes here should ideally be protected, but keeping consistent with existing structure
// In a real scenario, you'd add middleware to verify admin role for POST/PUT/DELETE
router.get('/', classConfigController.getAllConfigs);
router.post('/', classConfigController.createConfig);
router.put('/:id', classConfigController.updateConfig);
router.delete('/:id', classConfigController.deleteConfig);

module.exports = router;
