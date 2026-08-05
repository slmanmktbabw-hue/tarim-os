// server.js - TARIM OS V1.0 Beta FINAL - 8 FILES - مصحح بدون أخطاء أقواس 🏰
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: process.env.CORS_ORIGIN || "*" }, 
  maxHttpBufferSize: 1e8 
});

app.use(helmet({ crossOriginEmbedderPolicy:false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended:true, limit:'100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 60*1000, max: 120 });
app.use('/api/', limiter);

global.io = io;
global.supportTickets = [];
global.FeedDB = {posts:[]};

console.log('🏰 TARIM OS - تحميل 4 راوترات سيادية...');

try { 
  app.use('/api', require('./security.js')); 
  console.log('✅ 1- security.js - حماية + كود عشوائي 6 أرقام'); 
} catch(e){ console.log('❌ security.js', e.message); }

try { 
  app.use('/api', require('./router.js')); 
  console.log('✅ 2- router.js - عمليات + فيد فيديو + بث 8د'); 
} catch(e){ console.log('❌ router.js', e.message); }

try { 
  app.use('/api', require('./settings.js')); 
  console.log('✅ 3- settings.js - إعدادات + QR + محفظة'); 
} catch(e){ console.log('❌ settings.js', e.message); }

try { 
  app.use('/api', require('./support.js')); 
  console.log('✅ 4- support.js - وارد + مرسلة + دعم'); 
} catch(e){ console.log('❌ support.js', e.message); }

app.post('/api/support/ticket', (req,res)=>{
  const ticket = {id:'T_'+Date.now(),...req.body,time:Date.now()};
  global.supportTickets.unshift(ticket);
  io.emit('support_new_ticket', ticket);
  console.log('🛠️ تذكرة دعم جديدة:', ticket.user);
  res.json({ok:true, ticket, msg: 'تم استلام تذكرتك سيادي - فريق الدعم يرد قريباً 👑'});
});

io.on('connection', (socket)=>{
  console.log('👑 ملك متصل:', socket.id);
  socket.on('join', (user)=>{ socket.user = user; console.log(`👤 ${user} دخل الميدان`); });
  socket.on('live_viewer_join', (data)=>{
    io.emit('viewer_count', {count: Math.floor(Math.random()*50)+1});
  });
  socket.on('send_live_heart', (data)=>{
    io.emit('live_heart', {user: data.user, time: Date.now()});
  });
  socket.on('send_live_comment', (data)=>{
    io.emit('live_comment', {user: data.user, text: data.text, time: Date.now()});
  });
  socket.on('disconnect', ()=> console.log('خرج:', socket.user||socket.id));
});

app.get('/api/ping', (req,res)=> res.json({ 
  ok: true, 
  msg: 'TARIM OS V1.0 Beta - 8 FILES LIVE - ينزل الميدان 🏰',
  king: 'AL',
  files: 8,
  site: 'tarimos.org',
  time: new Date().toISOString(),
  features: ['حماية + كود','رئيسية + فيديو','عمليات + بث 8د','وارد ومرسلة','إعدادات + QR','عين AI','دعم فني','نشر + LIVE + فلش']
}));

app.get('*', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

const PORT = process.env.PORT || 10000;
server.listen(PORT,'0.0.0.0',()=>{
  console.log(`\n🏰 TARIM OS V1.0 Beta FINAL LIVE on ${PORT}`);
  console.log(`👑 KING: AL - أبو سلمان`);
  console.log(`🌍 tarimos.org - ينزل الميدان للشغل الآن!`);
  console.log(`📁 4 راوترات + قاعدة بيانات = نظام سيادي كامل\n`);
});
