const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// 1. السماح بالكاميرا والمايك + منع التخزين المؤقت
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

// 2. السماح بقراءة البيانات بصيغة JSON
app.use(express.json());

// 3. ربط مجلد الواجهة - خلي index.html و script.js في نفس المجلد
app.use(express.static(__dirname));

// 4. نقطة الدخول الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ======================= API =======================

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        res.json({ 
            success: true, 
            user: { 
                username, 
                okx_balance: 100, 
                followers: 0, 
                likes: 0, 
                posts: 0 
            } 
        });
    } else {
        res.json({ success: false, message: 'بيانات غير صالحة' });
    }
});

// انشاء حساب
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    res.json({ 
        success: true, 
        user: { 
            username, 
            okx_balance: 100, 
            followers: 0, 
            likes: 0, 
            posts: 0 
        } 
    });
});

// توليد QR
app.post('/api/qr', (req, res) => {
    res.json({ qr: 'TARIM_OS_SECURE_' + (req.body.phone || 'Gooaz') });
});

// ======================= SOCKET.IO =======================
// إدارة الاتصالات اللحظية للبث المباشر
io.on('connection', (socket) => {
    console.log('✅ مستخدم متصل:', socket.id);

    socket.on('startLive', () => {
        const roomId = 'room_' + Math.floor(Math.random() * 1000);
        socket.join(roomId);
        socket.emit('liveStarted', { roomId });
        io.to(roomId).emit('viewersUpdate', 1);
        console.log(`🔴 بث بدأ في الغرفة: ${roomId}`);
    });

    socket.on('liveLike', (roomId) => {
        socket.to(roomId).emit('newLike', { from: 'مستخدم' });
    });

    socket.on('liveComment', ({ roomId, text }) => {
        io.to(roomId).emit('newComment', { from: 'مستخدم', text });
    });

    socket.on('sendGift', (roomId) => {
        io.to(roomId).emit('newGift', { from: 'مستخدم متميز' });
    });

    socket.on('stopLive', () => {
        socket.broadcast.emit('liveEnded');
        console.log('⏹️ البث انتهى');
    });

    socket.on('disconnect', () => {
        console.log('❌ انقطع الاتصال:', socket.id);
    });
});

// ======================= التشغيل =======================
server.listen(PORT, () => {
    console.log(`🚀 TARIM OS شغال بنجاح على: http://localhost:${PORT}`);
});
