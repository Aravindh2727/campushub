const jwt = require('jsonwebtoken');

const demoAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized (Demo)' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'DEMO_SECRET_KEY');
        req.user = decoded; // { uid, email, role }
        
        // Populate dbUser to mimic Firebase auth behavior in production
        const { readCollection } = require('./demoDataService');
        const users = readCollection('users');
        req.dbUser = users.find(u => u.uid === decoded.uid);
        
        if (req.dbUser && req.dbUser.isActive === false) {
            return res.status(403).json({ error: 'User is deactivated' });
        }
        
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid Demo Token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.dbUser && req.dbUser.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

module.exports = { demoAuthMiddleware, adminOnly };
