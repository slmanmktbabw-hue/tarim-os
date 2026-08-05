// server.js - TARIM OS V1 FINAL - STABLE
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ربط الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// محاولة استدعاء الروتر المخصص إن وجد
try {
    const router = require('./router');
    app.use('/api', router);
    console.log('✅ Custom router loaded');
} catch (e) {
    console.log('ℹ️ Using built-in royal routes');
}

// ================== الروتات السيادية المدمجة ==================

// 1. تسجيل الدخول
app.post('/api/auth/login', (req, res) => {
    const { user, pass } = req.body;
    console.log(`👑 Login attempt: ${user}`);
    
    // حالياً نقبل أي دخول - لاحقاً نربطه بقاعدة بيانات
    res.json({ 
        ok: true, 
        msg: 'تم فتح القلعة بنجاح', 
        token: 'KING_TOKEN_' + Date.now(),
        user: user || 'AL'
    });
});

// 2. نشر منشور جديد
app.post('/api/publish', (req, res) => {
    const { content } = req.body;
    const token = req.headers.authorization;
    console.log(`📢 New Post by ${token}: ${content}`);
    
    // هنا بنحفظ في قاعدة البيانات لاحقاً
    res.json({ 
        ok: true, 
        msg: '📢 تم حفظ المنشور السيادي في سيرفرات TARIM OS',
        id: Date.now()
    });
});

// 3. بدء البث المباشر
app.post('/api/live', (req, res) => {
    console.log('🔴 LIVE Started by KING AL');
    res.json({ 
        ok: true, 
        msg: '🔴 البث السيادي بدأ - 8 دقائق',
        streamUrl: '/live/king'
    });
});

// 4. فحص السيرفر
app.get('/api/ping', (req, res) => {
    res.json({ 
        ok: true, 
        site: 'tarimos.org', 
        king: 'AL',
        status: 'القلعة السيادية تعمل'
    });
});

// توجيه باقي المسارات لملف الواجهة الرئيسي SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر
server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================`);
    console.log(`🏰 TARIM OS LIVE on port ${PORT}`);
    console.log(`👑 KING: AL`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`====================================`);
});
