// server.js - TARIM OS v12.1 Sovereign Server
// تشغيل: node server.js أو npm start

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3001;
const SOVEREIGN_KEY = crypto.randomBytes(32); // AES-256
const PIN_SOVEREIGN = ["2026", "AL2026"];

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('dist'));

// --- قاعدة بيانات SQLite محاكاة (JSON File) ---
const DB_PATH = './tarim_db.json';
function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { tasks: [], logs: [], gifts: [], seals: [] }; }
}
function saveDB(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

// --- تشفير AES-256 ---
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', SOVEREIGN_KEY, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  return { iv: iv.toString('hex'), data: enc };
}
function decrypt(obj) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', SOVEREIGN_KEY, Buffer.from(obj.iv, 'hex'));
  let dec = decipher.update(obj.data, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

// --- API ---

// 1. تسجيل الدخول السيادي
app.post('/api/auth/verify', (req, res) => {
  const { identifier, pin } = req.body;
  console.log(`[AUTH] محاولة دخول: ${identifier}`);
  if (PIN_SOVEREIGN.includes(pin)) {
    const token = crypto.randomBytes(32).toString('hex');
    return res.json({ success: true, token, message: 'تم فتح القلعة - السيرفرات نشطة 🛡️' });
  }
  return res.status(401).json({ success: false, message: 'رمز خاطئ - الوصول مرفوض ⛔' });
});

// 2. المهام السيادية
app.get('/api/tasks', (req, res) => {
  const db = loadDB();
  res.json(db.tasks);
});
app.post('/api/tasks', (req, res) => {
  const db = loadDB();
  db.tasks.push({ id: Date.now(), ...req.body, createdAt: new Date().toISOString() });
  saveDB(db);
  io.emit('task:update', db.tasks);
  res.json({ success: true });
});

// 3. توليد الختم والـ QR
app.post('/api/seal/generate', (req, res) => {
  const { documentId } = req.body;
  const sealData = `TARIM-SEAL-${documentId}-${Date.now()}`;
  const encrypted = encrypt(sealData);
  const db = loadDB();
  db.seals.push({ id: documentId, ...encrypted, timestamp: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true, qrPayload: encrypted, seal: sealData });
});

// 4. SOS بروتوكول طوارئ
app.post('/api/emergency/sos', (req, res) => {
  const { location, user } = req.body;
  console.log(`🚨 SOS من ${user} في ${location}`);
  io.emit('emergency:sos', { user, location, time: new Date().toISOString() });
  res.json({ success: true, message: 'تم تفعيل بروتوكول الطوارئ - جاري تتبع الموقع' });
});

// 5. Tesseract OCR (محاكاة - اربطه لاحقاً بـ tesseract.js)
app.post('/api/ai/scan', async (req, res) => {
  // هنا تضع tesseract.js الحقيقي
  setTimeout(() => {
    res.json({
      success: true,
      extracted: 'وثيقة ميدانية معتمدة - تريم حضرموت',
      confidence: 98.7,
      encryption: 'AES-256'
    });
  }, 2000);
});

// --- Socket.io - البث والغرفة المشتركة ---
io.on('connection', (socket) => {
  console.log(`[SOCKET] عميل متصل: ${socket.id} 🟢`);

  socket.on('warroom:message', (msg) => {
    const db = loadDB();
    const entry = { ...msg, id: Date.now(), time: new Date().toLocaleTimeString('ar-SA') };
    db.logs.push(entry);
    saveDB(db);
    io.emit('warroom:message', entry);
    
    // رد AI تلقائي
    setTimeout(() => {
      const aiReply = {
        id: Date.now()+1,
        from: 'ai',
        text: `تم استلام التوجيه السيادي: "${msg.text}" - جاري التنفيذ على 12 عقدة...`,
        time: new Date().toLocaleTimeString('ar-SA')
      };
      db.logs.push(aiReply);
      saveDB(db);
      io.emit('warroom:message', aiReply);
    }, 1000);
  });

  socket.on('broadcast:gift', (gift) => {
    console.log(`🎁 هدية سيادية: ${gift.type}`);
    const db = loadDB();
    db.gifts.push(gift);
    saveDB(db);
    io.emit('broadcast:gift', gift);
  });

  socket.on('broadcast:live', (data) => {
    socket.broadcast.emit('broadcast:live', data);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] انقطع: ${socket.id} 🔴`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║  TARIM OS v12.1 - السيرفر السيادي   ║
  ║  الحالة: ACTIVE 🟢                  ║
  ║  المنفذ: ${PORT}                          ║
  ║  التشفير: AES-256 نشط               ║
  ║  https://localhost:${PORT}               ║
  ╚══════════════════════════════════════╝
  `);
});
