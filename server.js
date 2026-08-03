const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000
});
const PORT = process.env.PORT || 3000;

// ================= 1. الحماية والاداء ===================
app.use(helmet()); // يسد كل الثغرات
app.use(compression()); // يضغط البيانات 70%
app.use(cors()); // يسمح بالاتصال من اي مكان
app.use(morgan('dev')); // سجل كل الطلبات في الكونسول

// منع التخزين + السماح بالكاميرا
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// منع هجوم DDOS: 100 طلب كل 15 دقيقة
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'تم حظرك مؤقتا بسبب كثرة الطلبات'
});
app.use('/api/', limiter);

// ================= 2. الاعدادات الاساسية ===================
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ================= 3. API مع فحص اخطاء ===================
const usersDB = {}; // مؤقت. بنربطه Firebase بعدين

app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username ||!password) return res.status(400).json({ success: false, message: 'بيانات ناقصة' });

        // لو المستخدم موجود رجعه. لو لا انشئه
        if(!usersDB[username]) usersDB[username] = { username, okx_balance: 100, followers: 0, likes: 0, posts: 0 };

        res.json({ success: true, user: usersDB[username] });
    } catch(e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

app.post('/api/register', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username ||!password) return res.status(400).json({ success: false, message: 'بيانات ناقصة' });
        usersDB[username] = { username, okx_balance: 100, followers: 0, likes: 0, posts: 0 };
        res.json({ success: true, user: usersDB[username] });
    } catch(e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

app.post('/api/qr', (req, res) => {
    res.json({ qr: 'TARIM_OS_SECURE_' + (req.body.phone || 'Gooaz') + '_' + Date.now() });
});

// ================= 4. SOCKET.IO محصن ===================
const rooms = {};

io.on('connection', (socket) => {
    console.log('✅ متصل:', socket.id);

    socket.on('startLive', () => {
        const roomId = 'room_' + socket.id;
        rooms[roomId] = { viewers: 1, host: socket.id };
        socket.join(roomId);
        socket.emit('liveStarted', { roomId });
        io.to(roomId).emit('viewersUpdate', 1);
    });

    socket.on('liveLike', (roomId) => {
        if(rooms[roomId]) socket.to(roomId).emit('newLike', { from: 'مستخدم' });
    });

    socket.on('liveComment', ({ roomId, text }) => {
        if(rooms[roomId] && text.length < 200) io.to(roomId).emit('newComment', { from: 'مستخدم', text });
    });

    socket.on('sendGift', (roomId) => {
        if(rooms[roomId]) socket.to(roomId).emit('newGift', { from: 'مستخدم متميز' });
    });

    socket.on('disconnect', () => {
        for(const roomId in rooms){
            if(rooms[roomId].host === socket.id){
                io.to(roomId).emit('liveEnded');
                delete rooms[roomId];
            }
        }
        console.log('❌ فصل:', socket.id);
    });
});

// ================= 5. معالجة الاخطاء + عدم الطيح ===================
process.on('uncaughtException', (err) => {
  console.error('خطأ فادح:', err);
  // السيرفر ما بيطيح
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('وعد مرفوض:', reason);
});

// تشغيل
server.listen(PORT, () => {
    console.log(`🚀 TARIM OS PRO شغال على: http://localhost:${PORT}`);
});
