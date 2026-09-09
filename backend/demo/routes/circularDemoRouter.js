const express = require('express');
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

router.delete('/:id', (req, res) => {
    let items = readCollection('circulars');
    items = items.filter(c => c._id !== req.params.id);
    writeCollection('circulars', items);
    res.json({ success: true });
});

module.exports = router;