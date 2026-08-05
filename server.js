/**
 * TARIM OS - سيرفر المخ وقلب التحكم المركزى السيادي (server.js)
 * الإمبراطور: أبو سلمان (AL) - تريم، حضرموت الخير 🌴
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// إعدادات الوسيط وقبول البيانات
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تفعيل الواجهات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات مؤقتة داخل الذاكرة (الذاكرة السيادية)
let sovereignPosts = [
    { id: 1, user: 'AL', text: 'أهلاً بك في النظام السيادي الإمبراطوري - تريم OS 👑', time: Date.now() }
];

/* ==========================================================================
   1. بوابة المصادقة والدخول (Auth APIs)
   ========================================================================== */
app.post('/api/auth/login', (req, res) => {
    const { user, pass } = req.body;
    res.json({ success: true, user: user || 'AL', token: 'sovereign_token_1997' });
});

app.post('/api/auth/register', (req, res) => {
    const { user, pass } = req.body;
    res.json({ success: true, user: user || 'AL', token: 'sovereign_token_1997' });
});

/* ==========================================================================
   2. إدارة الفيد والمنشورات السيادية (Feed APIs)
   ========================================================================== */
app.get('/api/feed/home', (req, res) => {
    res.json(sovereignPosts);
});

app.post('/api/feed/publish-video', (req, res) => {
    const { user, text } = req.body;
    const newPost = { id: Date.now(), user: user || 'AL', text: text || 'محتوى سيادي', time: Date.now() };
    sovereignPosts.unshift(newPost);
    
    // بث التحديث الفوري عبر السوكت لجميع المتصلين
    io.emit('broadcast_post', newPost);
    res.json({ success: true, post: newPost });
});

/* ==========================================================================
   3. قلب التحكم السيادي ومدير التشغيل العام (Brain & Admin APIs)
   ========================================================================== */
app.get('/api/admin/system-status', (req, res) => {
    try {
        res.json({
            status: "Online 🟢",
            sovereign: "TARIM OS V1.0 Beta",
            commander: "أبو سلمان (AL)",
            location: "تريم - حضرموت الخير 🌴",
            uptime: Math.floor(process.uptime()) + " ثانية",
            memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
            totalSystemMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
            activeConnections: io.engine.clientsCount || 0,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: "خطأ في استشعار قلب التحكم السيادي" });
    }
});

app.post('/api/admin/command-broadcast', (req, res) => {
    const { adminKey, command, message } = req.body;
    
    if (adminKey !== 'AL_SOVEREIGN_1997') {
        return res.status(403).json({ error: "مرفوض: مفتاح السيادة غير مطبق" });
    }

    io.emit('sovereign_alert', { command, message, time: new Date() });
    res.json({ success: true, broadcasted: message });
});

/* ==========================================================================
   4. إدارة الاتصالات الفورية (Socket.io Real-Time)
   ========================================================================== */
io.on('connection', (socket) => {
    console.log("🔗 اتصال سيادي جديد:", socket.id);

    socket.on('join', (username) => {
        socket.join(username);
        console.log(`👤 المواطن السيادي انضم: ${username}`);
    });

    socket.on('disconnect', () => {
        console.log("❌ انقطع الاتصال السيادي:", socket.id);
    });
});

/* ==========================================================================
   تشغيل السيرفر المركزي
   ========================================================================== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🏰 سيرفر المخ السيادي يعمل بنجاح على المنفذ: ${PORT} - تريم حضرموت`);
});
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

// إتاحة الـ io عالمياً لكي تستخدمه ملفات الراوتر
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
