const express = require('express');
const router = express.Router();
const { readCollection, writeCollection } = require('../demoDataService');

const { demoAuthMiddleware, adminOnly } = require('../demoAuthMiddleware');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.json(readCollection('classconfigs'));
});

router.post('/', demoAuthMiddleware, adminOnly, (req, res) => {
    const { standard, section, subjects } = req.body;
    if (!standard || !section) return res.status(400).json({ error: 'Standard and section required' });
    let configs = readCollection('classconfigs');
    if (configs.find(c => c.standard === standard && c.section === section)) {
        return res.status(400).json({ error: 'Configuration already exists' });
    }
    const newConfig = { _id: uuidv4(), standard, section, subjects: subjects || [] };
    configs.push(newConfig);
    writeCollection('classconfigs', configs);
    res.status(201).json(newConfig);
});

router.put('/:id', demoAuthMiddleware, adminOnly, (req, res) => {
    const { id } = req.params;
    const { subjects } = req.body;
    let configs = readCollection('classconfigs');
    const index = configs.findIndex(c => c._id === id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    configs[index].subjects = subjects || configs[index].subjects;
    writeCollection('classconfigs', configs);
    res.json(configs[index]);
});

router.delete('/:id', demoAuthMiddleware, adminOnly, (req, res) => {
    const { id } = req.params;
    let configs = readCollection('classconfigs');
    const initialLen = configs.length;
    configs = configs.filter(c => c._id !== id);
    if (configs.length === initialLen) return res.status(404).json({ error: 'Not found' });
    writeCollection('classconfigs', configs);
    res.json({ message: 'Deleted successfully' });
});

module.exports = router;