// server.js - TARIM OS V7.3 Sovereign Palace - FINAL PRODUCTION SEAL
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const router = require('./router');
const royalSecurity = require('./security');

const app = express();
const server = http.createServer(app);

// ================= 1. فحص السيادة قبل التشغيل =================
if (!process.env.JWT_SECRET) {
    console.error('🚨 [FATAL] JWT_SECRET غير موجود في .env - إيقاف القلعة فوراً');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const PORT = process.env.PORT || 10000;

// ================= 2. إعداد الثقة لـ Render - مهم جداً لـ Rate Limit =================
app.set('trust proxy', 1); // Render / Cloudflare / Nginx

// ================= 3. تفعيل الدرع السيادي V7.3 - يجب أن يكون أولاً =================
royalSecurity.setup(app);

// ================= 4. CORS سيادي محصن - لا * أبداً في الإنتاج =================
app.use(cors({
    origin: function (origin, callback) {
        // السماح للطلبات بدون origin مثل تطبيق الموبايل و Postman في التطوير فقط
        if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
        const allowed = CORS_ORIGIN.split(',').map(o => o.trim());
        if (allowed.includes(origin) || allowed.includes('*') && process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else if (allowed.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS BLOCKED] محاولة دخول من: ${origin}`);
            callback(new Error('CORS Sovereign Blocked'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ================= 5. محركات الجسد - حدود آمنة =================
app.use(express.json({ limit: '2mb' })); // كان 50mb - الآن 2mb فقط - يحمي JSON DB
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ================= 6. الواجهة الإمبراطورية - مع كاش سيادي =================
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// ================= 7. مسارات API السيادية =================
app.use('/api', router);

// ================= 8. فحص صحة القلعة - للمراقبة العالمية =================
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        system: "TARIM OS V7.3 Sovereign",
        shield: "Helmet V8 + esm.unpkg.com?bundle&target=es2022&min + bcrypt",
        version: "7.3.0 Imperial Final",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// ================= 9. نظام البث المباشر السيادي V7.3 - محصن بـ JWT =================
const io = new Server(server, {
    cors: {
        origin: CORS_ORIGIN.split(','),
        methods: ["GET", "POST"],
        credentials: true
    },
    maxHttpBufferSize: 1e6 // 1MB فقط للبث - يمنع إغراق الفيديو
});

// حارس البث - لا أحد يبث إلا بتوكن
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized LIVE'));
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        next();
    } catch {
        next(new Error('Invalid LIVE Token'));
    }
});

io.on('connection', (socket) => {
    console.log(`[LIVE V7.3] اتصال سيادي: ${socket.user.username} - ${socket.id}`);

    socket.on('start-live', (data) => {
        const safeData = {
            username: socket.user.username,
            userId: socket.user.id,
            title: String(data.title || '').substring(0, 100),
            startedAt: new Date().toISOString()
        };
        socket.broadcast.emit('live-started', safeData);
    });

    socket.on('stop-live', () => {
        socket.broadcast.emit('live-ended', { userId: socket.user.id, username: socket.user.username });
    });

    socket.on('disconnect', () => {
        console.log(`[LIVE] انقطع: ${socket.id}`);
    });
});

// ================= 10. توجيه PWA - آخر مسار =================
app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return res.status(404).json({ success: false, message: "المسار السيادي غير موجود" });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================= 11. مصيدة الأخطاء السيادية =================
app.use((err, req, res, next) => {
    if (err.message.includes('CORS')) {
        return res.status(403).json({ success: false, message: "ممنوع - CORS سيادي" });
    }
    console.error('[TARIM V7.3 ERROR]', err.stack);
    res.status(500).json({ success: false, message: "خطأ داخلي في القصر الرئاسي" });
});

// ================= 12. التشغيل السيادي النهائي =================
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`👑 TARIM OS V7.3 SOVEREIGN SEAL - FINAL`);
    console.log(`🌴 Location: Tarim, Hadhramaut - Imperial`);
    console.log(`🚀 Port: ${PORT} - 0.0.0.0`);
    console.log(`🛡️  Shield: Helmet V8 + RateLimit 150/5 + CORS ${CORS_ORIGIN}`);
    console.log(`🔗 ESM Shield: esm.unpkg.com?bundle&target=es2022&min`);
    console.log(`📡 LIVE Engine: Socket.IO V4.8.1 + JWT Auth`);
    console.log(`🔐 DB: bcrypt 12 rounds + atomic save 600`);
    console.log(`🔗 Health: /health | Status: /api/status`);
    console.log(`=========================================`);
});

// ================= 13. إغلاق آمن يحفظ قاعدة البيانات =================
function gracefulShutdown(signal) {
    console.log(`[TARIM V7.3] إغلاق سيادي آمن ${signal}...`);
    io.close(() => {
        server.close(() => {
            console.log('[TARIM V7.3] تم حفظ الدولة وإغلاق القلعة بأمان 👑');
            process.exit(0);
        });
    });
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
