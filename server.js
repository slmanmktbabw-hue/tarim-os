const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

// ========== 1. درع الحماية ==========
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// منع DDOS
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// السماح بالكاميرا
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*');
  next();
});

// ========== 2. الملفات ==========
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ========== 3. قاعدة بيانات مؤقتة ==========
const usersDB = {};

// ========== 4. API ==========
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username ||!password) return res.status(400).json({ success: false });
    if(!usersDB[username]) usersDB[username] = { username, okx_balance: 100, followers: 0, likes: 0, posts: 0 };
    res.json({ success: true, user: usersDB[username] });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    usersDB[username] = { username, okx_balance: 100, followers: 0, likes: 0, posts: 0 };
    res.json({ success: true, user: usersDB[username] });
});

app.post('/api/qr', (req, res) => {
    res.json({ qr: 'TARIM_OS_' + (req.body.phone || 'Gooaz') + '_' + Date.now() });
});

// ========== 5. SOCKET.IO للبث ==========
io.on('connection', (socket) => {
    console.log('متصل:', socket.id);
    let roomId = null;

    socket.on('startLive', () => {
        roomId = 'room_' + socket.id;
        socket.join(roomId);
        socket.emit('liveStarted', { roomId });
        io.to(roomId).emit('viewersUpdate', 1);
    });

    socket.on('liveLike', (r) => socket.to(r).emit('newLike', { from: 'مستخدم' }));
    socket.on('liveComment', (data) => io.to(data.roomId).emit('newComment', { from: 'مستخدم', text: data.text }));
    socket.on('sendGift', (r) => socket.to(r).emit('newGift', { from: 'مستخدم' }));
    socket.on('stopLive', () => { if(roomId) io.to(roomId).emit('liveEnded'); });
    socket.on('disconnect', () => { if(roomId) io.to(roomId).emit('liveEnded'); });
});

// ========== 6. كود عدم الطيح ==========
process.on('uncaughtException', err => console.log('تم الامساك بالخطأ:', err.message));
process.on('unhandledRejection', reason => console.log('وعد مرفوض:', reason));

server.listen(PORT, () => console.log(`🚀 TARIM OS PRO شغال على ${PORT}`));
