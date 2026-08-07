const express = require('express');
const router = express.Router();
const db = require('./database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'TARIM_OS_ROYAL_SECRET_KEY_AL_DRAGON_2026_SOVEREIGN_X7a9';

// فحص حالة النظام السيادي
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: "Online",
        system: "TARIM OS V1.0 Beta",
        sovereign: "Emperor AL",
        location: "Tarim, Hadhramaut",
        stats: db.getStats()
    });
});

// تسجيل الدخول السيادي
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.getUserByUsername(username);

    if (user && user.password === password) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: "👑 أهلاً بك أيها الإمبراطور في القلعة السيادية",
            token,
            user: { id: user.id, username: user.username, role: user.role, okxBalance: user.okxBalance, wallet: user.wallet }
        });
    } else {
        res.status(401).json({ success: false, message: "❌ بيانات الاعتماد السيادية غير مطابقة" });
    }
});

// جلب كل المنشورات
router.get('/posts', (req, res) => {
    try {
        const posts = db.getAllPosts();
        res.json({ success: true, posts });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في جلب المنشورات السيادية" });
    }
});

// إنشاء منشور جديد
router.post('/posts', (req, res) => {
    try {
        const { userId, username, content, videoUrl } = req.body;
        const newPost = db.createPost({
            userId: userId || 1,
            username: username || "AL",
            content: content || "",
            videoUrl: videoUrl || null
        });
        res.json({ success: true, post: newPost });
    } catch (e) {
        res.status(500).json({ success: false, message: "خطأ في نشر المحتوى السيادي" });
    }
});

// تسجيل إعجاب (لايك) على منشور
router.post('/posts/:id/like', (req, res) => {
    const likes = db.likePost(req.params.id);
    if (likes !== null) {
        res.json({ success: true, likes });
    } else {
        res.status(404).json({ success: false, message: "المنشور غير موجود" });
    }
});

// إضافة تعليق على منشور
router.post('/posts/:id/comments', (req, res) => {
    const { username, text } = req.body;
    const comment = db.addComment(req.params.id, {
        username: username || "مستخدم سيادي",
        text: text || ""
    });
    res.json({ success: true, comment });
});

// جلب تعليقات منشور
router.get('/posts/:id/comments', (req, res) => {
    const comments = db.getCommentsByPostId(req.params.id);
    res.json({ success: true, comments });
});

module.exports = router;
