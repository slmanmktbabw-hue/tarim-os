
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// السماح بقراءة البيانات بصيغة JSON
app.use(express.json());

// ربط مجلد الواجهة الأمامية (public)
app.use(express.static(path.join(__dirname, 'public')));

// نقطة اختبار أو تسجيل الدخول البسيطة
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        res.json({ success: true, user: { username, okki_balance: 100, followers: 0, likes: 0, posts: 0 } });
    } else {
        res.json({ success: false, message: 'بيانات غير صالحة' });
    }
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    res.json({ success: true, user: { username, okki_balance: 100, followers: 0, likes: 0, posts: 0 } });
});

app.post('/api/qr', (req, res) => {
    res.json({ qr: 'TARIM_OS_SECURE_' + (req.body.phone || 'Gooaz') });
});

// إدارة الاتصالات اللحظية عبر Socket.io للبث المباشر
io.on('connection', (socket) => {
    console.log('مستخدم متصل:', socket.id);

    socket.on('startLive', () => {
        const roomId = 'room_' + Math.floor(Math.random() * 1000);
        socket.join(roomId);
        socket.emit('liveStarted', { roomId });
        io.to(roomId).emit('viewersUpdate', 1);
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
    });

    socket.on('disconnect', () => {
        console.log('انقطع الاتصال:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`السيرفر يعمل بنجاح على البورت: ${PORT}`);
});
