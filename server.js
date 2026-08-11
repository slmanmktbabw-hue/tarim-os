// ==============================================================================
// server.js - TARIM OS V8.7 SECURE - حصن لا يسقط
// ==============================================================================
"use strict";
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');
const fs = require('fs');

// 1. فشل سريع لو الأسرار ناقصة - لا توليد عشوائي في الإنتاج
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('[FATAL] JWT_SECRET مفقود أو قصير - ضعه في Vercel Env');
}
if (!process.env.MONGO_URI) {
  throw new Error('[FATAL] MONGO_URI مفقود');
}
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'https://tarimos.org').split(',').map(s=>s.trim()).filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('CORS blocked'), false);
    },
    credentials: true
  }
});
const PORT = process.env.PORT || 10000;

// 2. حماية المجلدات
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 3. دروع أساسية - قبل أي مسار
app.disable('x-powered-by');
app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  next();
});
app.use(require('cors')({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE']
}));
app.use(express.json({ limit: '100kb' })); // كان 10mb - قللناه
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// منع الوصول لملفات حساسة
app.use('/public', (req,res,next)=>{
  if (req.path.includes('.env') || req.path.includes('settings.js')) return res.status(403).end();
  next();
});
app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'deny',
  index: false
}));

// Security middleware إجباري
const { settings } = require('./settings'); // يحمل JWT بعد التحقق
const security = require('./security');
security.setup(app);

// DB
let db, connectDB, seedCastle;
try {
  const dbModule = require('./database');
  db = dbModule.tarimDb || dbModule;
  connectDB = dbModule.connectDB;
  seedCastle = dbModule.seedCastle;
} catch(e) { db = {}; }

// Router - كل شيء محمي
app.use('/api', require('./router'));

// ========== محرك الهدايا - محمي بـ JWT ==========
const giftValues = { heart: 0.1, rose: 0.5, crown: 1.0, rocket: 5.0 };

function authSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const jwt = require('jsonwebtoken');
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { next(new Error('Auth failed')); }
}
io.use(authSocket);

app.post('/api/gift', async (req,res)=>{
  try {
    if (!req.user) return res.status(401).json({ok:false});
    const { to, type } = req.body;
    if (!to || typeof to!== 'string' || to.length>30) return res.status(400).json({ok:false, error:'مستلم غير صالح'});
    const giftType = ['heart','rose','crown','rocket'].includes(type)? type : 'heart';
    const value = giftValues[giftType];

    // السعر لا يأتي من العميل أبداً
    const txId = `TX_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    io.emit('gift-received', { from: req.user.id, to, type: giftType, value, tx: txId });
    return res.json({ ok: true, tx: txId, value });
  } catch(e){ return res.status(500).json({ok:false}); }
});

// NOWPayments - IPN يحتاج Raw Body
app.post('/api/ipn/nowpayments', express.raw({type:'application/json'}), (req,res)=>{
  try {
    const sig = req.headers['x-nowpayments-sig'];
    if (!process.env.NOWPAY_IPN_SECRET ||!sig) return res.status(400).json({ok:false});
    const hmac = crypto.createHmac('sha512', process.env.NOWPAY_IPN_SECRET).update(req.body).digest('hex');
    if (hmac!== sig) return res.status(403).json({ok:false});
    const body = JSON.parse(req.body.toString());
    if (['finished','confirmed'].includes(body.payment_status)) {
      io.emit('gift-paid', { order_id: body.order_id, amount: body.price_amount });
    }
    return res.json({ok:true});
  } catch(e){ return res.status(500).json({ok:false}); }
});

io.on('connection', (socket)=>{
  socket.on('start-live', (d)=>{
    if (socket.user?.role!== 'king' && socket.user?.role!== 'merchant') return;
    io.emit('live-started', { user: socket.user.id,...d });
  });
  socket.on('gift', ()=>{}); // ممنوع من العميل - نستخدم /api/gift فقط
});

// Frontend - الأدمن محمي
app.get('/admin', require('./security').auth, require('./security').isKing, (req,res)=>{
  res.sendFile(path.join(__dirname,'public','admin.html'));
});
app.get('/admin.html', require('./security').auth, require('./security').isKing, (req,res)=>{
  res.sendFile(path.join(__dirname,'public','admin.html'));
});
app.get('/uploads/:file', (req,res)=>{
  const file = path.basename(req.params.file);
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(file)) return res.status(403).end();
  res.sendFile(path.join(uploadDir, file));
});
app.get('*', (req,res)=>{
  if (req.path.startsWith('/api')) return res.status(404).json({msg:'غير موجود'});
  res.sendFile(path.join(__dirname,'public','index.html'));
});

app.use((err,req,res,next)=>{
  console.error(err.message);
  res.status(500).json({ success: false, msg: 'خطأ داخلي' }); // لا تفشي التفاصيل
});

(async()=>{
  try { await connectDB?.(); await seedCastle?.(); } catch(e){ console.error(e.message); }
  server.listen(PORT,'0.0.0.0',()=> console.log(`👑 TARIM V8.7 SECURE LIVE ON ${PORT}`));
})();

module.exports = app;
