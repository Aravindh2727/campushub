const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', materialController.addMaterial);
router.get('/', materialController.getMaterialsByClass);
router.put('/:materialId', materialController.updateMaterial);
router.delete('/:materialId', materialController.deleteMaterial);

module.exports = router;
