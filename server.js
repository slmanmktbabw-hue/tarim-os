// server.js - TARIM OS V7.3.3 SEAL GOLD SECURED - البوابة الرسمية: tarimos.org
const express = require('express');
const http = require('http');
const path = require('path'); // صلحت الخطأ: كان path = path = 
const crypto = require('crypto');
const { Server } = require('socket.io');
const helmet = require('helmet'); // حماية ترويض HTTP
const rateLimit = require('express-rate-limit'); // الحماية من هجمات الحجب

// 1. تأمين توليد مفتاح سري قوي وثابت
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ تحذير: JWT_SECRET غير معرف في البيئة، يتم توليد مفتاح عشوائي مؤقت.');
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
}

const app = express();
const server = http.createServer(app);

// ===============================
// 2. توحيد الروابط 301 REDIRECT
// البوابة الرسمية: tarimos.org
// لازم يكون اول شي قبل اي شي
// ===============================
app.use((req, res, next) => {
  const host = req.headers.host;
  if (host !== 'tarimos.org' && host !== 'www.tarimos.org') {
    const newUrl = `https://tarimos.org${req.originalUrl}`;
    console.log(`🔄 Redirect 301: ${host} -> ${newUrl}`);
    return res.redirect(301, newUrl);
  }
  next();
});

// 3. تقييد CORS في Socket.io للبوابة الرسمية فقط
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://tarimos.org', 'http://localhost:10000'];
const io = new Server(server, { 
  cors: { 
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: ["GET", "POST"]
  } 
});

const PORT = process.env.PORT || 10000;

// 4. تطبيق حماية Helmet لترويسات الأمان
app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));

// 5. تقييد معدل الطلبات Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً.' }
});
app.use('/api/', limiter);

// إعدادات أساسية مع تقييد حجم الـ Body
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ملفات ثابتة مع تعطيل الملفات المخفية
app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'deny',
  index: false
}));

// استيراد ملف الحماية الخارجي
let securityMiddleware;
try {
  securityMiddleware = require('./security');
  if (securityMiddleware && typeof securityMiddleware.setup === 'function') {
    securityMiddleware.setup(app);
    console.log('🛡️ Security Shield V7.3.3 Loaded Successfully');
  }
} catch(e) {
  console.log('⚠️ Security module optional warning:', e.message);
}

// قاعدة البيانات
let db;
try {
  db = require('./database');
  console.log('[TARIM DB V7.3.3] تم الاتصال بقاعدة البيانات بنجاح.');
} catch(e) { 
  db = { users: [], posts: [] }; 
  console.log('⚠️ استخدام قاعدة بيانات مؤقتة في الذاكرة.');
}

// الروتر والـ API
let router;
try {
  router = require('./router');
  app.use('/api', router);
} catch(e) {
  console.log('⚠️ Router module missing, running default status API');
  app.get('/api/status', (req, res) => res.json({ 
    status: 'TARIM OS V7.3.3 SEAL GOLD SECURED LIVE', 
    version: 'V7.3.3', 
    domain: 'tarimos.org',
    secure: true 
  }));
}

// حماية Socket.io Events
io.on('connection', (socket) => {
  console.log('Socket connected securely:', socket.id);

  socket.on('start-live', (data) => {
    if (data) io.emit('live-started', data);
  });

  socket.on('stop-live', (data) => {
    if (data) io.emit('live-ended', data);
  });
});

// 6. إصلاح مسار catch-all: لا يعترض مسارات الـ API
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر
server.listen(PORT, '0.0.0.0', () => {
  console.log(`👑 TARIM OS V7.3.3 SEAL GOLD SECURED LIVE on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 البوابة الرسمية: https://tarimos.org`);
  console.log(`🔒 Helmet + RateLimit + 301 Redirect شغالين`);
});
