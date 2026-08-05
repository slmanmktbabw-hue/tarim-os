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

// قراءة الملفات الثابتة حصرياً من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/ping', (req, res) => {
    res.json({ ok: true, site: 'tarimos.org', king: 'AL' });
});

io.on('connection', (socket) => {
    socket.on('join', (user) => {
        socket.join(user);
    });
});

// توجيه جميع المسارات إلى index.html داخل مجلد public
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏰 TARIM OS LIVE on port ${PORT} - KING AL`);
});
