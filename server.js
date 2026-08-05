// server.js - TARIM OS V1 FINAL - STABLE
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// إتاحة الـ io عالمياً لكي تستخدمه ملفات الراوتر (مثل router.js و settings.js)
global.io = io;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

// ربط الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// ربط نظام الأمان والدخول (security.js) تحت مسار /api
try {
    const securityRouter = require('./security');
    app.use('/api', securityRouter);
    console.log('🛡️ تم ربط بوابة الأمان والدخول بنجاح');
} catch (e) {
    console.log('⚠️ لم يتم العثور على security.js أو حدث خطأ:', e.message);
}

// ربط راوتر الإعدادات (settings.js) تحت مسار /api
try {
    const settingsRouter = require('./settings');
    app.use('/api', settingsRouter);
    console.log('⚙️ تم ربط راوتر الإعدادات بنجاح');
} catch (e) {
    console.log('⚠️ لم يتم العثور على settings.js أو حدث خطأ:', e.message);
}

// ربط راوتر الدعم والمراسلة (support.js) تحت مسار /api
try {
    const supportRouter = require('./support');
    app.use('/api', supportRouter);
    console.log('📥 تم ربط راوتر الدعم والمراسلة بنجاح');
} catch (e) {
    console.log('⚠️ لم يتم العثور على support.js أو حدث خطأ:', e.message);
}

// ربط الراوتر الرئيسي للعمليات والفيد (router.js) تحت مسار /api
try {
    const router = require('./router');
    app.use('/api', router);
    console.log('⚡ تم ربط الراوتر الأساسي بنجاح');
} catch (e) {
    console.log('Using built-in royal routes');
}

// مسار الفحص السريع
app.get('/api/ping', (req, res) => {
    res.json({ ok: true, site: 'tarimos.org', king: 'AL' });
});

// إدارة اتصالات السوكت (Socket.io) الحية
io.on('connection', (socket) => {
    console.log(`🔗 اتصال سيادي جديد: ${socket.id}`);

    socket.on('join', (user) => {
        socket.join(user);
        console.log(`👑 المستخدم ${user} انضم للغرفة السيادية`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ انقطع الاتصال السيادي: ${socket.id}`);
    });
});

// توجيه باقي المسارات لملف الواجهة الرئيسي
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏰 TARIM OS LIVE on port ${PORT} - KING AL`);
});
