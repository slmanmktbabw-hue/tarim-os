// server.js - TARIM OS V8.5.2 - TRIPLE-PAY FORTRESS HARDENED
const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ [FATAL] JWT_SECRET مفقود');
    process.exit(1);
  } else {
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('base64');
  }
}

const app = express();
const server = http.createServer(app);

// 1. الترتيب الصحيح: trust proxy أولاً
app.set('trust proxy', 1);

// 2. الـ IPN يحتاج Raw Body قبل الـ JSON - هذا هو الإصلاح الأهم
app.post('/api/ipn/nowpayments', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const NOWPAY_IPN_SECRET = process.env.NOWPAY_IPN_SECRET;
    if (NOWPAY_IPN_SECRET) {
      const sigHeader = req.headers['x-nowpayments-sig'];
      if (!sigHeader) return res.status(400).json({ ok: false, error: 'Missing signature' });

      const hmac = crypto.createHmac('sha512', NOWPAY_IPN_SECRET);
      hmac.update(req.body); // req.body هنا Buffer خام
      const signature = hmac.digest('hex');

      // مقارنة آمنة ضد Timing Attack
      const sigBuf = Buffer.from(signature, 'hex');
      const headerBuf = Buffer.from(sigHeader, 'hex');
      if (sigBuf.length!== headerBuf.length ||!crypto.timingSafeEqual(sigBuf, headerBuf)) {
        return res.status(403).json({ ok: false, error: 'Invalid signature' });
      }
    }

    const eventData = JSON.parse(req.body.toString());
    const { payment_status, order_id, price_amount, pay_amount } = eventData;

    // تحقق إضافي: التأكد من شكل order_id وعدم التلاعب بالمبلغ
    if (!order_id ||!order_id.startsWith('TARIM_')) return res.json({ ok: true });
    const amount = Number(price_amount || pay_amount);
    if (amount <=0 || amount > 10000) return res.json({ ok: true });

    if (payment_status === 'finished' || payment_status === 'confirmed') {
      const io = app.get('io');
      if (order_id.startsWith('TARIM_AD')) {
        io?.emit('new-ad-paid', { order_id, amount });
      } else {
        io?.emit('gift-received', { from: 'card_payer', to: 'streamer', type: 'crown', value: amount, tx: order_id, method: 'card', verified: true });
      }
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('IPN Error:', e.message);
    return res.status(200).json({ ok: true }); // ارجع 200 دائماً لـ NOWPayments حتى لا يعيد المحاولة بلا نهاية
  }
});

// 3. الآن فقط فعل الـ JSON والـ Static بعد ما خلصنا من الـ Raw
app.use(express.json({ limit: '100kb' })); // قللت من 1MB لـ 100KB لمنع DoS
app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// Security
let securityMiddleware;
try {
  securityMiddleware = require('./security');
  securityMiddleware.setup(app);
} catch(e) {
  console.error('Security shield failed - STOPPING:', e.message);
  process.exit(1); // لا تعمل أبداً بدون درع
}

// DB & Router
const db = require('./database');
const router = require('./router');
app.use('/api', router);

const PORT = process.env.PORT || 10000;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://tarimos.org'];
const OKX_PAYOUT_WALLET = process.env.OKX_WALLET || '';

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

const giftValues = { 'heart': 0.1, 'rose': 0.5, 'crown': 1.0, 'rocket': 5.0 };
const adsDB = [];

// === المسارات المحصنة - يجب أن تكون محمية بـ authGuard ===
const { authGuard } = require('./router'); // افصل authGuard في ملف auth.js لاحقاً

app.post('/api/gift', authGuard, (req, res) => {
  try {
    const { to, type, amount, method } = req.body || {};
    const from = req.user.username; // لا تأخذه من body أبداً - من التوكن فقط
    if (!to || typeof to!== 'string') return res.status(400).json({ ok: false, error: 'المستلم ناقص' });

    const giftType = ['heart','rose','crown','rocket'].includes(type)? type : 'heart';
    const value = giftValues[giftType] || 0.1;

    const txId = `tarim_${crypto.randomUUID()}`;

    try { db.saveGift?.({ from: from.slice(0,50), to: to.slice(0,50), type: giftType, value, tx: txId, method: method||'okx', at: new Date().toISOString(), verified: false }); } catch{}

    io.emit('gift-received', { from, to: to.slice(0,50), type: giftType, value, tx: txId, method: method||'okx' });
    return res.json({ ok: true, tx: txId, value });
  } catch { return res.status(500).json({ ok: false }); }
});

app.post('/api/promote', authGuard, (req, res) => {
  const { postId, budget, days, target, method } = req.body;
  const b = Number(budget);
  if (isNaN(b) || b < 1 || b > 1000) return res.status(400).json({ ok: false, error: 'ميزانية غير صالحة' });
  const adId = `AD_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
  const ad = { id: adId, postId: String(postId||'').slice(0,50), owner: req.user.username, budget: b, days: Number(days)||1, target: String(target||'حضرموت').slice(0,50), maxViews: Math.floor(b/0.01), method: method||'okx', createdAt: new Date().toISOString(), status: 'pending_payment' };
  adsDB.push(ad);
  if (adsDB.length > 200) adsDB.shift();
  return res.json({ ok: true, adId, views: ad.maxViews });
});

// Socket محصن - يمنع انتحال الهدايا
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized socket'));
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'tarim-os-v7.4' });
    socket.user = decoded;
    next();
  } catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
  socket.on('start-live', (d) => {
    if (socket.user.role!== 'Emperor' && socket.user.username!== d?.username) return;
    io.emit('live-started', {...d, by: socket.user.username });
  });
});

// 404 للـ API قبل الـ wildcard
app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'API not found' }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`👑 TARIM OS V8.5.2 FORTRESS LIVE on ${PORT}`);
});
