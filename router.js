// router.js - TARIM OS V7.3 Sovereign Router - IMPERIAL SHIELD
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('./database');
const jwt = require('jsonwebtoken');

// 1. المفتاح السيادي - لا يعمل النظام بدونه في الإنتاج
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('[TARIM SECURITY FATAL] JWT_SECRET غير موجود - إيقاف القلعة');
    process.exit(1);
}

// 2. درع Brute Force - يمنع تخمين كلمة السر
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 5, // 5 محاولات فقط
    message: { success: false, message: "محاولات كثيرة - تم قفل البوابة 15 دقيقة 🛡️" },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. حارس التوثيق الملكي V7.3
function authGuard(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "التوثيق السيادي مطلوب" });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "انتهت جلسة السيادة - سجل دخول مجدداً" });
        }
        return res.status(403).json({ success: false, message: "توكن مزور - تم رصد المحاولة" });
    }
}

// 4. تنظيف محصن V7.3 - يمنع XSS و الحقن
function sanitize(text) {
    if (!text) return "";
    let clean = String(text).trim();
    clean = clean.substring(0, 2000);
    clean = clean.replace(/javascript:/gi, '').replace(/data:/gi, '').replace(/vbscript:/gi, '');
    clean = clean.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return clean;
}

function sanitizeUrl(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (!['http:', 'https:'].includes(u.protocol)) return null;
        return u.toString().substring(0, 500);
    } catch { return null; }
}

// --- المسارات السيادية ---

router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: "Online",
        system: "TARIM OS V7.3 Imperial Sovereign",
        shield: "Helmet + RateLimit + bcrypt V7.3",
        time: new Date().toISOString(),
        stats: db.getStats()
    });
});

// تسجيل الدخول - محصن V7.3
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: "البيانات ناقصة" });
        }
        
        const user = db.getUserByUsername(username.trim());
        if (!user) {
            await new Promise(r => setTimeout(r, 800));
            return res.status(401).json({ success: false, message: "بيانات الاعتماد غير صحيحة" });
        }

        const isValid = await db.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            await new Promise(r => setTimeout(r, 800));
            return res.status(401).json({ success: false, message: "بيانات الاعتماد غير صحيحة" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d', issuer: 'tarim-os-v7.3' }
        );

        res.json({
            success: true,
            message: "أهلاً بك في القلعة المحصنة V7.3 👑",
            token,
            user: { id: user.id, username: user.username, role: user.role, name: user.name, okxBalance: user.okxBalance, wallet: user.wallet }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في بوابة الدخول السيادية" });
    }
});

router.get('/posts', (req, res) => {
    try {
        res.json({ success: true, posts: db.getAllPosts() });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في جلب المنشورات" });
    }
});

router.post('/posts', authGuard, (req, res) => {
    try {
        const { content, videoUrl, imageUrl } = req.body;
        const newPost = db.createPost({
            userId: req.user.id,
            username: req.user.username,
            content: sanitize(content),
            videoUrl: sanitizeUrl(videoUrl),
            imageUrl: sanitizeUrl(imageUrl)
        });
        res.status(201).json({ success: true, post: newPost });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في النشر" });
    }
});

router.post('/posts/:id/like', authGuard, (req, res) => {
    try {
        const likes = db.likePost(req.params.id, req.user.id);
        if (likes !== null) res.json({ success: true, likes });
        else res.status(404).json({ success: false, message: "المنشور غير موجود" });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في الإعجاب" });
    }
});

router.delete('/posts/:id', authGuard, (req, res) => {
    try {
        const ok = db.deletePost(req.params.id, req.user.id);
        if (ok) res.json({ success: true, message: "تم الحذف السيادي" });
        else res.status(403).json({ success: false, message: "لا تملك صلاحية الحذف" });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في الحذف" });
    }
});

module.exports = router;
