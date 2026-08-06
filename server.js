// server.js - TARIM OS V1 FINAL - STABLE
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

global.io = io;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

try {
    const router = require('./router');
    app.use('/', router); // تم إزالة /api ليتطابق مع الروابط مباشرة
} catch (e) {
    console.log('Using built-in royal routes');
}

app.post('/api/auth/login', (req, res) => {
    res.json({ ok: true, msg: 'تم فتح القلعة بنجاح', token: 'KING_TOKEN' });
});

app.get('/api/ping', (req, res) => {
    res.json({ ok: true, site: 'tarimos.org', king: 'AL' });
});

io.on('connection', (socket) => {
    socket.on('join', (user) => {
        socket.join(user);
    });
    socket.on('chat_message', (data) => {
        io.emit('chat_message', data);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🏰 TARIM OS Server running on port ${PORT}`);
});
