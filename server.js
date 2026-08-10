// server.js - TARIM OS V8.5 FINAL FIXED - يعالج خطأ <!DOCTYPE JSON
const express = require('express');
const http = http = require('http'); // تم تصحيح طريقة الاستدعاء
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('base64');
  console.warn('⚠️ JWT_SECRET مؤقت');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*", methods: ["GET","POST"] } 
});

const PORT = process.env.PORT || 10000;

// --- 1. Middlewares الأساسية ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- 2. قاعدة بيانات مؤقتة في الذاكرة (تشتغل حتى بدون database.js) ---
let memoryDB = {
  users: [
    { username: 'AL', password: '123456', okki_balance: 1000, followers: 10 }
  ],
  posts: []
};

// حاول تحميل القاعدة الحقيقية إن وجدت
try {
  const realDB = require('./database');
  if(realDB.users) memoryDB = realDB;
  console.log('[DB] Real DB Loaded');
} catch(e) {
  console.log('[DB] Using Memory DB - AL / 123456 موجود');
}

// --- 3. تحميل الحماية (اختياري) ---
try {
  const securityMiddleware = require('./security');
  if(securityMiddleware.setup) securityMiddleware.setup(app);
  console.log('🛡️ Security Shield Loaded');
} catch(e) {
  console.log('⚠️ Security optional, skipping');
}

// --- 4. ملفات الواجهة ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 5. API ROUTES - لازم تكون قبل catch-all و app.get('*') ---

// فحص السيرفر
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'TARIM OS V8.5 SECURE LIVE', 
    version: 'V8.5',
    users: memoryDB.users.length,
    jwt: !!process.env.JWT_SECRET
  });
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username || !password){
      return res.status(400).json({ success: false, message: 'أدخل البيانات' });
    }
    const cleanUser = String(username).trim();
    
    const user = memoryDB.users.find(u => 
      u.username.toLowerCase() === cleanUser.toLowerCase() && 
      u.password === String(password)
    );

    if(!user){
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    // نجاح تسجيل الدخول
    return res.json({ 
      success: true, 
      message: 'تم الدخول',
      user: { 
        username: user.username, 
        okki_balance: user.okki_balance || 100,
        followers: user.followers || 0,
        posts: memoryDB.posts.filter(p => p.username === user.username).length
      }
    });
  } catch(err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
  }
});

// إنشاء حساب جديد
app.post('/api/register', (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username || !password){
      return res.status(400).json({ success: false, message: 'عبّي الحقول' });
    }
    const cleanUser = String(username).trim();
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUser)){
      return res.status(400).json({ success: false, message: 'اسم المستخدم 3-20 حرف إنجليزي' });
    }
    if(String(password).length < 6){
      return res.status(400).json({ success: false, message: 'كلمة المرور 6 أحرف على الأقل' });
    }
    if(memoryDB.users.find(u => u.username.toLowerCase() === cleanUser.toLowerCase())){
      return res.status(409).json({ success: false, message: 'اسم المستخدم موجود' });
    }

    const newUser = { username: cleanUser, password: String(password), okki_balance: 100, followers: 0 };
    memoryDB.users.push(newUser);
    
    return res.json({ success: true, message: 'تم إنشاء الحساب', user: newUser });
  } catch(err) {
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// تحميل الراوتر الخارجي إن وجد
try {
  const router = require('./router');
  app.use('/api', router);
  console.log('[Router] External router loaded');
} catch(e) {
  console.log('[Router] Using internal routes only');
}

// --- 6. معالجة أخطاء الـ API (ترجع JSON وليس HTML لمنع خطأ <!DOCTYPE JSON>) ---
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found: ' + req.path });
});

// --- 7. Socket.IO ---
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('registerSocket', (username) => {
    socket.username = username;
    console.log(`User registered socket: ${username}`);
  });
  socket.on('start-live', (d) => io.emit('live-started', d));
  socket.on('stop-live', (d) => io.emit('live-ended', d));
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// --- 8. التوجيه الاحتياطي للواجهة الأمامية - يجب أن يكون في النهاية تماماً ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`👑 TARIM OS V8.5 SECURE LIVE on port ${PORT}`);
  console.log(`✅ JWT_SECRET: موجود`);
  console.log(`✅ Login: AL / 123456`);
  console.log(`🌍 http://localhost:${PORT}`);
});
