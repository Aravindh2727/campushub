const express = require('express');
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

router.put('/:id', (req, res) => {
    let items = readCollection('materials');
    const index = items.findIndex(m => m._id === req.params.id);
    if (index > -1) {
        items[index] = { ...items[index], ...req.body };
        writeCollection('materials', items);
        res.json({ success: true, data: items[index] });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

router.delete('/:id', (req, res) => {
    let items = readCollection('materials');
    items = items.filter(m => m._id !== req.params.id);
    writeCollection('materials', items);
    res.json({ success: true });
});

module.exports = router;