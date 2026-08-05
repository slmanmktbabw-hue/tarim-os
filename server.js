// server.js - TARIM OS V1.0 Beta FINAL - 8 FILES - مكتمل ينزل الميدان للشغل 🏰
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 1e8 });

app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

global.io = io;
global.supportTickets = [];

console.log('🏰 TARIM OS - تحميل 8 ملفات...');

try { app.use('/api', require('./security.js')); console.log('✅ 1- security.js - حماية + كود'); } catch(e){ console.log('❌ security.js', e.message); }
try { app.use('/api', require('./database.js')); console.log('✅ 2- database.js - رئيسية'); } catch(e){ console.log('❌ database.js', e.message); }
try { app.use('/api', require('./router.js')); console.log('✅ 3- router.js - عمليات'); } catch(e){ console.log('❌ router.js', e.message); }
try { app.use('/api', require('./support.js')); console.log('✅ 4- support.js - وارد + دعم'); } catch(e){ console.log('❌ support.js', e.message); }
try { app.use('/api', require('./settings.js')); console.log('✅ 5- settings.js - إعدادات'); } catch(e){ console.log('❌ settings.js', e.message); }

// بث مباشر + عين AI + دعم
app.post('/api/support/ticket', (req,res)=>{
  const ticket = req.body;
  global.supportTickets.unshift(ticket);
  io.emit('support_new_ticket', ticket);
  console.log('🛠️ تذكرة دعم جديدة:', ticket.user);
  res.json({ok:true, ticket, msg: 'تم استلام تذكرتك - فريق الدعم يرد قريباً'});
});

io.on('connection', (socket)=>{
  console.log('👑 ملك متصل:', socket.id);
  socket.on('join', (user)=>{ socket.user = user; console.log(`👤 ${user} دخل الميدان`); });
  socket.on('disconnect', ()=> console.log('خرج:', socket.user||socket.id));
});

app.get('/api/ping', (req,res)=> res.json({ 
  ok: true, 
  msg: 'TARIM OS V1.0 Beta - 8 FILES LIVE - ينزل الميدان 🏰',
  king: 'AL',
  files: 8,
  site: 'tarimos.org',
  features: ['حماية + كود','رئيسية + فيديو','عمليات + بث 8د','وارد ومرسلة','إعدادات + QR','عين AI','دعم فني','نشر + LIVE + فلش']
}));

app.get('*', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

const PORT = process.env.PORT || 10000;
server.listen(PORT,'0.0.0.0',()=>{
  console.log(`\n🏰 TARIM OS V1.0 Beta FINAL LIVE on ${PORT}`);
  console.log(`👑 KING: AL`);
  console.log(`🌍 tarimos.org - ينزل الميدان للشغل الآن!`);
  console.log(`📁 8 ملفات مع سيفر تشغيل كامل\n`);
});
