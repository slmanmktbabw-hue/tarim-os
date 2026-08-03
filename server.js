import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // npm i node-fetch

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

// امان سيادي
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ========== بروكسي عين الذكاء ==========
app.post('/api/ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if(!prompt) return res.status(400).json({error: 'مافي نص'});

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل الاتصال بالذكاء' });
  }
});

// ========== بروكسي الدعم ==========
app.post('/api/support', async (req, res) => {
  const { message } = req.body;
  console.log('رسالة دعم جديدة:', message);
  res.json({ reply: 'استلمنا رسالتك يا ملك، فريق TARIM OS بيرد عليك قريب' });
});

// ========== API الهدايا ==========
app.post('/api/wallet/gift', async (req, res) => {
  const { from, to, gift } = req.body;
  console.log(`هدية: ${from} ارسل ${gift} الى ${to}`);
  res.json({ status: 'ok', message: `تم استلام ${gift}` });
});

// ========== SOCKET.IO للبث المباشر ==========
let viewers = 0;
let onlineUsers = {};

io.on('connection', (socket) => {
  viewers++;
  io.emit('viewers_count', viewers);

  socket.on('register', (data) => {
    onlineUsers[socket.id] = data.phone;
  });

  socket.on('like_live', (data)=> socket.broadcast.emit('like_live', data));
  socket.on('comment_live', (data)=> socket.broadcast.emit('comment_live', data));

  socket.on('disconnect', ()=>{
    viewers--; 
    delete onlineUsers[socket.id];
    io.emit('viewers_count', viewers);
  });
});

// الصفحة الرئيسية
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => console.log(`TARIM OS V1.0 Beta شغال على http://localhost:${PORT}`));
