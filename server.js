// server.js - TARIM OS V8.6 KING EDITION - الملك + TRIPLE-PAY + ADS + ضريبة سيادية + لا يسقط أبداً
const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

// توليد مفتاح مؤقت لو غير موجود - لا يسقط
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET غير موجود - توليد مؤقت');
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('base64');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;

// === إعدادات بوابات الدفع والملك ===
const NOWPAYMENTS_API = 'https://api.nowpayments.io/v1';
const NOWPAY_API_KEY = process.env.NOWPAY_API_KEY || '';
const NOWPAY_IPN_SECRET = process.env.NOWPAY_IPN_SECRET || '';
const OKX_PAYOUT_WALLET = process.env.OKX_WALLET || '0x53ab96a7e6c8f2d1b4c5e9f0a3b8d2c1e6f5a9b0';
const KING_KEY = process.env.KING_KEY || 'TARIM_KING_2026';
const KING_TAX_GIFT = 0.10; // 10% للملك من الهدايا
const KING_TAX_AD = 0.20; // 20% للملك من الإعلانات

// إعدادات أساسية
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// استيراد الحماية
let securityMiddleware;
try {
  securityMiddleware = require('./security');
  securityMiddleware.setup(app);
  console.log('🛡️ Security Shield V8.6 KING Loaded');
} catch(e) {
  console.log('⚠️ Security optional:', e.message);
}

// قاعدة البيانات
let db;
try {
  db = require('./database');
  console.log('[TARIM DB V8.6 KING] تم إنشاء القاعدة');
} catch(e) { db = { users: [], posts: [], saveGift: null }; }

let router;
try {
  router = require('./router');
  app.use('/api', router);
} catch(e) {
  console.log('Router optional');
  app.get('/api/status', (req, res) => res.json({
    status: 'TARIM OS V8.6 KING EDITION LIVE',
    version: 'V8.6 KING',
    jwt:!!process.env.JWT_SECRET,
    okx_wallet: OKX_PAYOUT_WALLET,
    nowpay:!!NOWPAY_API_KEY,
    king_tax_gift: KING_TAX_GIFT,
    king_tax_ad: KING_TAX_AD
  }));
}

// === TARIM UES Engine ===
app.post('/get_next_video', (req, res) => {
  const data = req.body || {};
  const current_video = data.current_video || {};
  const watch_time = Number(current_video.watch_time || data.watch_time || 0);
  if (watch_time > 20) {
    return res.json({
      "status": "success",
      "action": "split_screen",
      "video_id": "short_funny_01",
      "proof": "20s to 8:19 stability - TARIM Protocol",
      "retention_lift": "+40%"
    });
  }
  return res.json({ "action": "wait", "reason": "building intent" });
});

// ==================================================================
// === الجيش 4 + قانون الملك - الهدايا + ضريبة 10% ===
// ==================================================================
const giftValues = { 'heart': 0.1, 'rose': 0.5, 'crown': 1.0, 'rocket': 5.0 };
const adsDB = [];
const pendingAds = [];
let kingEarnings = { total: 0, gifts: 0, ads: 0, txs: [] };

function isKingRequest(req){
  const from = (req.body?.from || req.query?.from || '').toLowerCase();
  const key = req.headers['x-king-key'] || req.body?.key || req.query?.key;
  return key === KING_KEY || ['al','slmanmktbabw-hue','الملك','الامبراطور'].includes(from) || key === 'TARIM_KING_2026';
}

app.post('/api/gift', (req, res) => {
  try {
    const { from, to, type, amount, method } = req.body || {};
    if(!from ||!to) return res.status(400).json({ ok:false, error: 'بيانات ناقصة' });
    const giftType = type || 'heart';
    const totalValue = giftValues[giftType] || Number(amount) || 0.1;

    // === قانون الملك 10% ===
    const kingCut = Number((totalValue * KING_TAX_GIFT).toFixed(4));
    const creatorCut = Number((totalValue * (1 - KING_TAX_GIFT)).toFixed(4));

    const txId = `0x53${Date.now().toString(16)}ab96_${crypto.randomBytes(4).toString('hex')}`;

    kingEarnings.total += kingCut;
    kingEarnings.gifts += kingCut;
    kingEarnings.txs.push({ id: txId, from, to, type: giftType, total: totalValue, king: kingCut, creator: creatorCut, method: method||'okx', at: new Date().toISOString() });
    if(kingEarnings.txs.length > 100) kingEarnings.txs.shift();

    try { if(db && typeof db.saveGift === 'function') db.saveGift({ from, to, type: giftType, value: totalValue, kingCut, creatorCut, tx: txId, method: method||'okx', at: new Date().toISOString() }); } catch(e){}

    io.emit('gift-received', { from, to, type: giftType, value: totalValue, creatorValue: creatorCut, kingValue: kingCut, tx: txId, method: method||'okx' });
    io.emit('king-earning', { kingCut, total: kingEarnings.total, type: 'gift' });

    console.log(`🎁 GIFT: ${from} -> ${to} | ${totalValue}$ = الملك ${kingCut}$ + المبدع ${creatorCut}$`);

    return res.json({
      ok: true,
      tx: txId,
      value: totalValue,
      kingCut: kingCut.toFixed(2),
      creatorCut: creatorCut.toFixed(2),
      msg: `تم إرسال ${giftType} 👑 الملك ${kingCut.toFixed(2)}$ + المبدع ${creatorCut.toFixed(2)}$`,
      okx_wallet: OKX_PAYOUT_WALLET
    });
  } catch(err){
    console.log('Gift error:', err.message);
    return res.status(500).json({ ok:false, error: 'فشل المعالجة' });
  }
});

app.post('/gift', (req, res) => {
  const { from, to, type } = req.body || {};
  const giftType = type || 'heart';
  const totalValue = giftValues[giftType] || 0.1;
  const kingCut = totalValue * KING_TAX_GIFT;
  const creatorCut = totalValue * (1 - KING_TAX_GIFT);
  const txId = `0x53${Date.now().toString(16)}ab96_${crypto.randomBytes(4).toString('hex')}`;
  io.emit('gift-received', { from: from||'AL', to: to||'streamer', type: giftType, value: totalValue, creatorValue: creatorCut, kingValue: kingCut, tx: txId, method:'okx' });
  return res.json({ ok: true, tx: txId, value: totalValue, kingCut, creatorCut, msg: `تم إرسال ${giftType} 👑` });
});

// ==================================================================
// === الجيش 5 + قانون الملك - الإعلانات + موافقة + ضريبة 20% ===
// ==================================================================
app.post('/api/promote', (req, res) => {
  try {
    const { postId, budget, days, target, method, from } = req.body || {};
    const b = Number(budget) || 1;
    if(b < 1) return res.status(400).json({ ok:false, error:'الميزانية 1$ على الأقل' });

    const isKing = isKingRequest(req);
    const kingAdTax = Number((b * KING_TAX_AD).toFixed(2));
    const realBudget = Number((b - kingAdTax).toFixed(2));
    const costPerView = 0.01;
    const views = Math.floor(realBudget / costPerView);
    const adId = `AD_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;

    const ad = {
      id: adId,
      postId: postId || Date.now(),
      owner: from || 'AL',
      budget: b,
      realBudget: realBudget,
      kingTax: kingAdTax,
      days: Number(days)||1,
      target: target || 'حضرموت',
      views: 0,
      maxViews: views,
      method: method || 'okx',
      createdAt: new Date().toISOString(),
      status: isKing? 'active' : 'pending',
      approvedBy: isKing? 'KING 👑' : null
    };

    if(ad.status === 'pending'){
      pendingAds.push(ad);
      if(pendingAds.length > 100) pendingAds.shift();
      console.log(`📢 AD PENDING: ${ad.owner} - ${b}$ ينتظر موافقة الملك | ضريبة ${kingAdTax}$`);
      io.emit('king-new-ad', ad);
      return res.json({
        ok:true,
        pending:true,
        adId,
        views: views,
        kingTax: kingAdTax,
        msg:`📢 إعلانك قيد مراجعة الملك 👑 - سيتم تفعيله خلال دقائق - الملك ${kingAdTax}$ + ${views} مشاهدة`,
      });
    }

    adsDB.push(ad);
    if (adsDB.length > 500) adsDB.shift();
    kingEarnings.total += kingAdTax;
    kingEarnings.ads += kingAdTax;
    io.emit('new-ad', ad);
    console.log(`📢 PROMO ACTIVE [KING]: ${ad.owner} دفع ${b}$ = الملك ${kingAdTax}$ + ${views} مشاهدة | ${ad.target}`);

    return res.json({
      ok: true,
      adId,
      views,
      kingTax: kingAdTax,
      realBudget: realBudget,
      msg: `🚀 تم ترويج منشورك لـ ${views} شخص في ${ad.target} - الملك أخذ ${kingAdTax}$ 👑`,
      cost: `${costPerView}$ لكل مشاهدة`,
      tx: `0xAD${Date.now().toString(16)}`
    });
  } catch(e){
    return res.status(500).json({ ok:false, error:e.message });
  }
});

app.get('/api/ads', (req,res)=>{
  const publicAds = adsDB.filter(a=>a.status==='active').slice(-30).reverse();
  res.json({ ads: publicAds, total: publicAds.length, pending: pendingAds.length });
});

// === لوحة تحكم الملك - إحصائيات وموافقة ===
app.get('/api/king/stats', (req, res)=>{
  const key = req.headers['x-king-key'] || req.query.key || req.query.k;
  if(key!== KING_KEY && key!== 'TARIM_KING_2026' && key!== process.env.KING_KEY) {
    return res.status(403).json({ ok:false, error:'غير مصرح - الملك فقط 👑' });
  }
  res.json({
    ok:true,
    earnings: kingEarnings,
    pendingAds: pendingAds,
    activeAds: adsDB.slice(-20).reverse(),
    king_wallet: OKX_PAYOUT_WALLET,
    tax_gift: KING_TAX_GIFT,
    tax_ad: KING_TAX_AD
  });
});

app.post('/api/king/approve-ad', (req,res)=>{
  const key = req.headers['x-king-key'] || req.body.key;
  if(key!== KING_KEY && key!== 'TARIM_KING_2026' && key!== process.env.KING_KEY) {
    return res.status(403).json({ ok:false, error:'الملك فقط' });
  }
  const { adId } = req.body;
  const idx = pendingAds.findIndex(a=>a.id===adId);
  if(idx===-1) return res.status(404).json({ ok:false, error:'الإعلان غير موجود' });
  const ad = pendingAds[idx];
  ad.status = 'active';
  ad.approvedBy = 'KING 👑';
  adsDB.push(ad);
  if (adsDB.length > 500) adsDB.shift();
  kingEarnings.total += ad.kingTax;
  kingEarnings.ads += ad.kingTax;
  pendingAds.splice(idx,1);
  io.emit('new-ad', ad);
  io.emit('ad-approved', { adId, owner: ad.owner, msg: `وافق الملك على إعلانك 👑` });
  console.log(`👑 KING APPROVED: ${ad.id} - ${ad.owner} - ${ad.budget}$`);
  res.json({ ok:true, msg:'✅ تمت موافقة الملك - الإعلان نشط الآن', ad });
});

app.post('/api/king/reject-ad', (req,res)=>{
  const key = req.headers['x-king-key'] || req.body.key;
  if(key!== KING_KEY && key!== 'TARIM_KING_2026') return res.status(403).json({ ok:false });
  const { adId } = req.body;
  const idx = pendingAds.findIndex(a=>a.id===adId);
  if(idx===-1) return res.status(404).json({ ok:false });
  const ad = pendingAds[idx];
  pendingAds.splice(idx,1);
  io.emit('ad-rejected', { adId, owner: ad.owner });
  res.json({ ok:true, msg:'تم رفض الإعلان' });
});

// ==================================================================
// === الجيش 6 - NOWPayments ===
// ==================================================================
app.post('/api/create-invoice', async (req, res) => {
  try {
    const { amount, type, from } = req.body || {};
    let payAmount = Number(amount) || giftValues[type] || 1;
    const cleanUser = (from||'AL').replace(/[^a-zA-Z0-9]/g,'').slice(0,20);
    const orderId = `TARIM_${Date.now()}_${cleanUser}`;

    if(!NOWPAY_API_KEY){
      return res.json({ ok: true, demo: true, invoice_url: `https://nowpayments.io/payment/?iid=${orderId}`, order_id: orderId, amount: payAmount });
    }

    const response = await fetch(`${NOWPAYMENTS_API}/invoice`, {
      method: 'POST',
      headers: { 'x-api-key': NOWPAY_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount: payAmount,
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        order_id: orderId,
        order_description: `Tarim Gift ${type||'heart'} - ${payAmount} USDT 👑 (King 10%)`,
        ipn_callback_url: `https://tarim-os-1.onrender.com/api/ipn/nowpayments`,
        success_url: `https://tarim-os-1.onrender.com/success?order=${orderId}`,
        cancel_url: `https://tarim-os-1.onrender.com/cancel?order=${orderId}`
      })
    });

    const data = await response.json();
    if(!response.ok){
      console.log('NOWPayments error:', data);
      return res.json({ ok:true, demo:true, invoice_url:`https://nowpayments.io/payment/?iid=${orderId}`, order_id:orderId, amount:payAmount });
    }
    console.log(`💳 Invoice KING: ${orderId} = ${payAmount}$`);
    return res.json({ ok:true, invoice_url:data.invoice_url, order_id:orderId, amount:payAmount, id:data.id });
  } catch(e){
    return res.status(500).json({ ok:false, error:e.message });
  }
});

app.post('/api/create-ad-invoice', async (req,res)=>{
  try {
    const { budget, target, from } = req.body || {};
    const b = Number(budget)||5;
    const cleanUser = (from||'AL').replace(/[^a-zA-Z0-9]/g,'').slice(0,20);
    const orderId = `TARIM_AD_${Date.now()}_${cleanUser}`;
    if(!NOWPAY_API_KEY){
      return res.json({ ok:true, demo:true, invoice_url:`https://nowpayments.io/payment/?iid=${orderId}`, order_id:orderId });
    }
    const response = await fetch(`${NOWPAYMENTS_API}/invoice`, {
      method:'POST',
      headers:{ 'x-api-key': NOWPAY_API_KEY, 'Content-Type':'application/json' },
      body: JSON.stringify({
        price_amount: b,
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        order_id: orderId,
        order_description: `Tarim ADS ${b}$ -> ${target||'حضرموت'} 🚀 (King 20%)`,
        ipn_callback_url: `https://tarim-os-1.onrender.com/api/ipn/nowpayments`,
        success_url: `https://tarim-os-1.onrender.com/success?ad=${orderId}`,
        cancel_url: `https://tarim-os-1.onrender.com/cancel?ad=${orderId}`
      })
    });
    const data = await response.json();
    if(!response.ok) return res.json({ ok:true, demo:true, invoice_url:`https://nowpayments.io/payment/?iid=${orderId}`, order_id:orderId });
    return res.json({ ok:true, invoice_url:data.invoice_url, order_id:orderId });
  } catch(e){ return res.status(500).json({ok:false, error:e.message}); }
});

app.post('/api/ipn/nowpayments', (req,res)=>{
  try{
    if (NOWPAY_IPN_SECRET) {
      const sigHeader = req.headers['x-nowpayments-sig'];
      if (!sigHeader) return res.status(400).json({ ok: false, error: 'Missing signature' });
      const sortedKeys = Object.keys(req.body).sort();
      const hmacObj = {};
      sortedKeys.forEach(key => { hmacObj[key] = req.body[key]; });
      const hmac = crypto.createHmac('sha512', NOWPAY_IPN_SECRET);
      hmac.update(JSON.stringify(hmacObj));
      const signature = hmac.digest('hex');
      if (signature!== sigHeader) return res.status(403).json({ ok: false, error: 'Invalid signature' });
    }
    const { payment_status, order_id, price_amount } = req.body || {};
    console.log(`💳 IPN KING: ${order_id} - ${payment_status} - ${price_amount}$`);
    if(payment_status === 'finished' || payment_status === 'confirmed' || payment_status === 'sending'){
      const isAd = order_id && order_id.startsWith('TARIM_AD');
      if(isAd){
        io.emit('new-ad-paid', { order_id, amount: price_amount });
      } else {
        const total = Number(price_amount)||0;
        const kingCut = total * KING_TAX_GIFT;
        const creatorCut = total * (1 - KING_TAX_GIFT);
        io.emit('gift-received', { from: 'card_payer', to: 'streamer', type: 'crown', value: total, creatorValue: creatorCut, kingValue: kingCut, tx: order_id, method: 'card' });
      }
    }
    return res.json({ ok:true });
  } catch(e){ return res.status(500).json({ ok:false, error: e.message }); }
});

// Socket
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('start-live', (d) => io.emit('live-started', d));
  socket.on('stop-live', (d) => io.emit('live-ended', d));
  socket.on('gift', (d) => io.emit('gift-received', d));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`👑 TARIM OS V8.6 KING EDITION LIVE on port ${PORT}`);
  console.log(`✅ JWT: ${process.env.JWT_SECRET? 'موجود' : 'مؤقت'}`);
  console.log(`💎 OKX Wallet KING: ${OKX_PAYOUT_WALLET}`);
  console.log(`💳 NOWPayments: ${NOWPAY_API_KEY? 'مفعل ✅' : 'DEMO ⚠️'}`);
  console.log(`🔒 IPN: ${NOWPAY_IPN_SECRET? 'مفعل ✅' : 'غير مفعل'}`);
  console.log(`👑 ضريبة الملك: هدايا ${KING_TAX_GIFT*100}% | إعلانات ${KING_TAX_AD*100}%`);
  console.log(`📢 ADS: ${adsDB.length} نشط | ${pendingAds.length} معلق`);
  console.log(`💰 أرباح الملك: ${kingEarnings.total.toFixed(2)} USDT`);
  console.log(`🌍 https://tarim-os-1.onrender.com`);
});
