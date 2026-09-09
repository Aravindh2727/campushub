const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');

router.get('/', (req, res) => {
    res.json({ success: true, data: readCollection('feedbacks') });
});

router.delete('/:id', (req, res) => {
    let items = readCollection('feedbacks');
    items = items.filter(f => f._id !== req.params.id);
    writeCollection('feedbacks', items);
    res.json({ success: true });
});

module.exports = router;