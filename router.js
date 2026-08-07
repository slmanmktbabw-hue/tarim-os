// router.js - TARIM OS Sovereign Router - PRODUCTION READY
const express = require('express');
const router = express.Router();
const db = require('./database');
const jwt = require('jsonwebtoken');

// 1. المفتاح السيادي - يأتي من.env فقط، لا يوجد احتياطي مكشوف
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[TARIM SECURITY] JWT_SECRET غير موجود في.env - النظام في خطر');
}

// 2. حارس التوثيق الملكي - Middleware
function authGuard(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "التوثيق السيادي مطلوب" });
    }
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ success: false, message: "صيغة التوكن غير صحيحة" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, username, role }
        next();
    } catch (e) {
        return res.status(403).json({ success: false, message: "التوكن منتهي أو مزور" });
    }
}

// 3. تنظيف المحتوى من حقن XSS
function sanitize(text) {
    if (!text) return "";
    return String(text).substring(0, 1000).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- المسارات السيادية ---

// فحص حالة النظام - عام
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: "Online",
        system: "TARIM OS V1.0 Imperial",
        sovereign: "Emperor AL",
        location: "Tarim, Hadhramaut",
        time: new Date().toISOString(),
        stats: db.getStats()
    });
});

// تسجيل الدخول السيادي - محصن
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username ||!password) {
            return res.status(400).json({ success: false, message: "اسم المستخدم وكلمة السر مطلوبان" });
        }

        const user = db.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ success: false, message: "المستخدم غير موجود في السجل السيادي" });
        }

        // تحقق مشفر - يتوافق مع database.js الجديد
        const isValid = db.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "بيانات الاعتماد السيادية غير مطابقة" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: "أهلاً بك أيها الإمبراطور في القلعة السيادية",
            token,
            user: { id: user.id, username: user.username, role: user.role, name: user.name, okxBalance: user.okxBalance, wallet: user.wallet }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "خطأ داخلي في بوابة الدخول" });
    }
});

// جلب كل المنشورات - عام
router.get('/posts', (req, res) => {
    try {
        const posts = db.getAllPosts();
        res.json({ success: true, posts });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في جلب المنشورات السيادية" });
    }
});

// إنشاء منشور جديد - محمي بالتوكن
router.post('/posts', authGuard, (req, res) => {
    try {
        const { content, videoUrl, imageUrl } = req.body;
        if (!content &&!videoUrl &&!imageUrl) {
            return res.status(400).json({ success: false, message: "المحتوى فارغ" });
        }

        const newPost = db.createPost({
            userId: req.user.id,
            username: req.user.username,
            content: sanitize(content),
            videoUrl: videoUrl || null,
            imageUrl: imageUrl || null
        });
        res.status(201).json({ success: true, post: newPost });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في نشر المحتوى السيادي" });
    }
});

// تسجيل إعجاب - محمي لمنع التزوير
router.post('/posts/:id/like', authGuard, (req, res) => {
    try {
        const likes = db.likePost(req.params.id, req.user.id);
        if (likes!== null) {
            res.json({ success: true, likes });
        } else {
            res.status(404).json({ success: false, message: "المنشور غير موجود" });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في تسجيل الإعجاب" });
    }
});

// إضافة تعليق - محمي
router.post('/posts/:id/comments', authGuard, (req, res) => {
    try {
        const { text } = req.body;
        if (!text ||!text.trim()) {
            return res.status(400).json({ success: false, message: "نص التعليق مطلوب" });
        }
        const comment = db.addComment(req.params.id, {
            userId: req.user.id,
            username: req.user.username,
            text: sanitize(text)
        });
        if (!comment) return res.status(404).json({ success: false, message: "المنشور غير موجود" });
        res.status(201).json({ success: true, comment });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في إضافة التعليق" });
    }
});

// جلب تعليقات منشور - عام
router.get('/posts/:id/comments', (req, res) => {
    try {
        const comments = db.getCommentsByPostId(req.params.id);
        res.json({ success: true, comments });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في جلب التعليقات" });
    }
});

module.exports = router;
