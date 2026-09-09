const express = require('express');
const router = express.Router();

router.post('/ask', (req, res) => {
    res.json({ success: true, answer: 'This is a mocked AI response for the offline demo mode.' });
});

module.exports = router;