const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { readCollection, writeCollection } = require('../demoDataService');
const { v4: uuidv4 } = require('uuid');
const { demoAuthMiddleware, adminOnly } = require('../demoAuthMiddleware');

router.post('/demo-login', (req, res) => {
    const { email, password } = req.body;
    if (password !== 'Demo@123') {
        return res.status(401).json({ error: 'Invalid demo credentials' });
    }
    const users = readCollection('users');
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ error: 'Demo user not found' });
    }
    
    // Create JWT
    const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, 'DEMO_SECRET_KEY', { expiresIn: '24h' });
    res.json({ token, user });
});

router.get('/me', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'DEMO_SECRET_KEY');
        const users = readCollection('users');
        const user = users.find(u => u.uid === decoded.uid);
        res.json(user || decoded);
    } catch(e) {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

router.get('/check-role', (req, res) => {
    const { email } = req.query;
    const users = readCollection('users');
    const user = users.find(u => u.email === email);
    res.json({ role: user ? user.role : 'unknown' });
});

router.get('/users', demoAuthMiddleware, adminOnly, (req, res) => {
    res.json(readCollection('users'));
});

router.put('/users/:uid/approve', demoAuthMiddleware, adminOnly, (req, res) => {
    const { uid } = req.params;
    const { status, role, assignedClasses } = req.body;
    let users = readCollection('users');
    const userIndex = users.findIndex(u => u.uid === uid);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
    
    users[userIndex] = { 
        ...users[userIndex], 
        status: status || 'approved', 
        role: role || 'teacher',
        ...(assignedClasses !== undefined && { assignedClasses })
    };
    writeCollection('users', users);
    res.json({ message: 'User approved successfully', user: users[userIndex] });
});

router.delete('/users/:uid', demoAuthMiddleware, adminOnly, (req, res) => {
    const { uid } = req.params;
    let users = readCollection('users');
    users = users.filter(u => u.uid !== uid);
    writeCollection('users', users);
    res.json({ message: 'User deleted successfully' });
});

router.patch('/users/:uid/deactivate', demoAuthMiddleware, adminOnly, (req, res) => {
    const { uid } = req.params;
    let users = readCollection('users');
    const userIndex = users.findIndex(u => u.uid === uid);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
    
    users[userIndex].isActive = false;
    writeCollection('users', users);
    res.json({ message: 'User deactivated successfully', user: users[userIndex] });
});

router.patch('/users/:uid/activate', demoAuthMiddleware, adminOnly, (req, res) => {
    const { uid } = req.params;
    let users = readCollection('users');
    const userIndex = users.findIndex(u => u.uid === uid);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
    
    users[userIndex].isActive = true;
    writeCollection('users', users);
    res.json({ message: 'User activated successfully', user: users[userIndex] });
});

module.exports = router;