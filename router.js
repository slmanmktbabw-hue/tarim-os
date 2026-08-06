// router.js - TARIM OS Router
const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
    res.json({ status: 'active', system: 'TARIM OS', owner: 'AL' });
});

router.post('/posts', (req, res) => {
    const { content, author } = req.body;
    res.json({ success: true, message: 'تم استلام المنشور بنجاح', data: { content, author } });
});

module.exports = router;
