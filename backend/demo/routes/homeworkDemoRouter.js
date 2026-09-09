const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.json({ success: true, data: readCollection('homeworks') });
});

router.post('/', (req, res) => {
    const hw = readCollection('homeworks');
    const newItem = { ...req.body, _id: 'HW-' + uuidv4(), date: new Date().toISOString() };
    hw.push(newItem);
    writeCollection('homeworks', hw);
    res.json({ success: true, data: newItem });
});

router.delete('/:id', (req, res) => {
    let hw = readCollection('homeworks');
    hw = hw.filter(h => h._id !== req.params.id);
    writeCollection('homeworks', hw);
    res.json({ success: true });
});

module.exports = router;