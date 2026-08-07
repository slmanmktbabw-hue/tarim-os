const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
    res.json({
        status: "Online",
        system: "TARIM OS V1.0 Beta",
        sovereign: "AL",
        location: "Tarim, Hadhramaut"
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === "AL") {
        res.json({ success: true, message: "أهلاً بك أيها الإمبراطور في قلعة تريم السيادية" });
    } else {
        res.status(401).json({ success: false, message: "بيانات الاعتماد غير مطابقة" });
    }
});

module.exports = router;

