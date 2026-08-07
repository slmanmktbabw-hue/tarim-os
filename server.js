// server.js - TARIM OS Sovereign Palace - PRODUCTION READY
require('dotenv').config(); // 1. أهم سطر - يجب أن يكون أول سطر

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const router = require('./router');
const royalSecurity = require('./security');

const app = express();
const server = http.createServer(app);

// 2. إعداد Socket.IO للبث المباشر 8 دقائق
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 10000;

// 3. تفعيل الدرع السيادي - بالطريقة الصحيحة المحصنة
if (royalSecurity.setup) {
    royalSecurity.setup(app); // الطريقة الجديدة الصحيحة
} else {
    royalSecurity(app); // للتوافق مع القديم
}

// 4. تفعيل CORS لربط النطاق السيادي
app.use(cors({
    origin: process.env.CORS_ORIGIN || true, // في الإنتاج ضع https://yourdomain.com
    credentials: true
}));

// 5. محركات جسد الدولة
app.use(express.json({ limit: '50mb' })); // للفيديو والصور
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 6. ربط مجلد الواجهة العامة - الواجهة الإمبراطورية
app.use(express.static(path.join(__dirname, 'public')));

// 7. مسارات النظام السيادي API
app.use('/api', router);

// 8. مسار الفحص السريع للسيرفرات العالمية Render / UptimeRobot
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        system: "TARIM OS Sovereign Server",
        version: "1.0.0 Imperial",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// 9. نظام البث المباشر السيادي - Socket.IO
io.on('connection', (socket) => {
    console.log(`[LIVE] اتصال سيادي جديد: ${socket.id}`);

    socket.on('start-live', (data) => {
        console.log(`[LIVE] بدأ بث: ${data.username}`);
        socket.broadcast.emit('live-started', data);
    });

    socket.on('stop-live', (data) => {
        socket.broadcast.emit('live-ended', data);
    });

    socket.on('disconnect', () => {
        console.log(`[LIVE] انقطع الاتصال: ${socket.id}`);
    });
});

// 10. التوجيه الشامل للـ PWA - يجب أن يكون آخر مسار
// استثني /api و /health و /socket.io
app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return res.status(404).json({ success: false, message: "المسار السيادي غير موجود" });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 11. مصيدة الأخطاء السيادية - لا تدع السيرفر يسقط
app.use((err, req, res, next) => {
    console.error('[TARIM ERROR]', err.stack);
    res.status(500).json({ success: false, message: "خطأ داخلي في القصر الرئاسي" });
});

// 12. التشغيل على كافة واجهات الشبكة - Render يتطلب 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`👑 TARIM OS Sovereign Server`);
    console.log(`🌴 Location: Tarim, Hadhramaut`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🛡️  Security: Active - Helmet + RateLimit`);
    console.log(`📡 LIVE Engine: Socket.IO Active`);
    console.log(`🔗 Health: /health`);
    console.log(`=========================================`);
});

// 13. إغلاق آمن عند إيقاف السيرفر
process.on('SIGTERM', () => {
    console.log('[TARIM] إغلاق سيادي آمن...');
    server.close(() => process.exit(0));
});
