/**
 * TARIM OS - الملف الرئيسي للسيرفر (Server.js)
 * الإشراف: أبو سلمان 👑
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// استدعاء ملفات الحماية والتخزين السيادية
const setupSecurity = require('./security');
const { initDatabase, getSovereignData, saveSovereignData } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// تفعيل درع الحماية
setupSecurity(app);

// تهيئة قاعدة البيانات والتخزين المحلي
initDatabase();

app.use(express.json());
// ربط المجلد العام لخدمة الواجهة والأزرار و app.js
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log(`🔌 عميل سيادي متصل بالقلعة: ${socket.id}`);

    socket.on('liveComment', (data) => {
        io.emit('newLiveComment', data);
    });

    socket.on('liveLike', (data) => {
        io.emit('newLiveLike', data);
    });

    socket.on('inboxMessage', (data) => {
        const db = getSovereignData();
        db.logs.push({ event: "Inbox Message", data, timestamp: new Date() });
        saveSovereignData(db);

        io.emit('newInboxMessage', data);
    });

    socket.on('disconnect', () => {
        console.log(`❌ انقطع اتصال العميل: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🏰 خادم TARIM OS السيادي يعمل بكامل طاقته على المنفذ: ${PORT}`);
});
