const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

// الحماية + السرعة
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.static(__dirname)); // يخدم index.html و script.js

// الصفحة الرئيسية
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// API وهمي عشان ما يعلق
app.post('/api/login', (req, res) => res.json({ success: true }));
app.post('/api/register', (req, res) => res.json({ success: true }));

// Socket.IO
io.on('connection', (socket) => {
    console.log('✅ متصل:', socket.id);
    socket.on('registerSocket', (user) => console.log('المستخدم دخل:', user));
    socket.on('disconnect', () => console.log('❌ فصل:', socket.id));
});

// عشان ما يطيح من اي خطأ
process.on('uncaughtException', err => console.log('تم الامساك بالخطأ:', err.message));
process.on('unhandledRejection', reason => console.log('وعد مرفوض:', reason));

server.listen(PORT, () => console.log(`🚀 TARIM OS PRO شغال على: http://localhost:${PORT}`));
