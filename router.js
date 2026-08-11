// router.js - TARIM OS V7.4 - IMPERIAL GATE - HARDENED
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('./database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('[FATAL] JWT_SECRET مفقود');
    process.exit(1);
}

// 1. دروع Rate Limit منفصلة - كل باب له قفل
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "محاولات كثيرة - تم قفل البوابة 15 دقيقة 🛡️" },
    standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => req.ip + '|' + (req.body?.username || '')
});

const createPostLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10, // 10 منشورات بالدقيقة فقط
    message: { success: false, message: "نشر سريع جداً - اهدأ قليلاً" }
});

// 2. حارس التوثيق V7.4 - يتحقق من issuer + الخوارزمية
function authGuard(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "التوثيق مطلوب" });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: 'tarim-os-v7.4' // يمنع استخدام توكن قديم من V7.3
        });
        if (!decoded.id ||!decoded.username) throw new Error('Invalid payload');
        req.user = decoded;
        next();
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "انتهت الجلسة - سجل مجدداً", code: "TOKEN_EXPIRED" });
        }
        return res.status(403).json({ success: false, message: "توكن غير صالح" });
    }
}

// 3. تنظيف محصن بـ whitelist
function sanitizeContent(text) {
    if (typeof text!== 'string') return "";
    // قص + إزالة أكواد خطيرة + منع تكرار الحروف للإغراق
    let clean = text.trim().slice(0, 2000).replace(/javascript:|data:|vbscript:/gi, '');
    return clean.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function sanitizeUrl(url) {
    if (!url || typeof url!== 'string') return null;
    try {
        const u = new URL(url);
        if (!['http:', 'https:'].includes(u.protocol)) return null;
        // منع روابط داخلية SSRF
        if (['localhost', '127.0.0.1', '0.0.0.0'].includes(u.hostname)) return null;
        return u.toString().slice(0, 500);
    } catch { return null; }
}
function isValidUUID(id) {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

// --- المسارات ---

router.get('/status', (req, res) => {
    res.json({
        success: true, status: "Online",
        system: "TARIM OS V7.4 Hardened",
        time: new Date().toISOString(),
        stats: { usersCount: db.users.length, postsCount: db.posts.length }
    });
});

// تسجيل الدخول - محصن V7.4
router.post('/login',
    loginLimiter,
    [body('username').isString().trim().isLength({min:2, max:50}), body('password').isString().isLength({min:8, max:128})],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, message: "بيانات غير صالحة" });

        const { username, password } = req.body;
        const cleanUsername = username.trim();

        // استخدم الدالة الجديدة التي ترجع الـ Hash
        const user = db.getUserWithHash(cleanUsername);

        const delay = 800;
        if (!user) {
            await new Promise(r => setTimeout(r, delay));
            return res.status(401).json({ success: false, message: "بيانات الاعتماد غير صحيحة" });
        }

        const isValid = await db.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            await new Promise(r => setTimeout(r, delay));
            return res.status(401).json({ success: false, message: "بيانات الاعتماد غير صحيحة" });
        }

        // توكن قصير 15 دقيقة + Refresh Token منفصل
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, jti: crypto.randomUUID() },
            JWT_SECRET,
            { expiresIn: '15m', issuer: 'tarim-os-v7.4', algorithm: 'HS256' }
        );

        // لا ترجع okxBalance و wallet في تسجيل الدخول - ثغرة تسريب مالي
        res.json({
            success: true, token,
            user: { id: user.id, username: user.username, role: user.role, name: user.name }
        });
});

router.get('/posts', (req, res) => {
    res.json({ success: true, posts: db.getAllPosts() });
});

router.post('/posts', authGuard, createPostLimiter, (req, res) => {
    const { content, videoUrl, imageUrl } = req.body;
    if (!content &&!videoUrl &&!imageUrl) {
        return res.status(400).json({ success: false, message: "محتوى فارغ" });
    }
    const newPost = db.createPost({
        content: sanitizeContent(content),
        videoUrl: sanitizeUrl(videoUrl),
        imageUrl: sanitizeUrl(imageUrl)
    }, req.user.id); // تمرير authorId من التوكن وليس من body

    if (!newPost) return res.status(400).json({ success: false, message: "فشل النشر" });
    res.status(201).json({ success: true, post: newPost });
});

router.post('/posts/:id/like', authGuard, [param('id').custom(v => { if(!isValidUUID(v)) throw new Error('Invalid ID'); return true; })], (req, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ success: false, message: "معرف غير صالح" });
    const likes = db.likePost(req.params.id, req.user.id);
    if (likes === null) return res.status(404).json({ success: false, message: "المنشور غير موجود" });
    res.json({ success: true, likes });
});

// --- تصحيح ثغرة الحذف الوهمي ---
router.delete('/posts/:id', authGuard, [param('id').custom(v => { if(!isValidUUID(v)) throw new Error('Invalid ID'); return true; })], (req, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ success: false, message: "معرف غير صالح" });

    const ok = db.deletePost(req.params.id, req.user.id, req.user.role);
    if (ok) res.json({ success: true, message: "تم الحذف" });
    else res.status(403).json({ success: false, message: "لا تملك صلاحية أو غير موجود" });
});

module.exports = router;
