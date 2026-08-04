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

// تفعيل الحماية السيادية على التطبيق
setupSecurity(app);

// تهيئة التخزين
initDatabase();

// قراءة بيانات الـ JSON للتطبيق
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// مسار تجريبي لجلب حالة التخزين عبر المنصة
app.get('/api/sovereign-status', (req, res) => {
    const dbData = getSovereignData();
    res.json({
        status: "Online",
        ruler: "أبو سلمان 👑",
        domain: "tarimos.org",
        totalLogs: dbData.logs.length
    });
});

io.on('connection', (socket) => {
    console.log(`🔌 تم اتصال عميل سيادي بالقلعة: ${socket.id}`);

    socket.on('liveComment', (data) => {
        io.emit('newLiveComment', data);
    });

    socket.on('liveLike', (data) => {
        io.emit('newLiveLike', data);
    });

    socket.on('inboxMessage', (data) => {
        // حفظ الرسالة في نظام التخزين السيادي
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
    console.log(`🏰 خادم TARIM OS السيادي يعمل بأعلى درجات الحماية والتخزين على المنفذ ${PORT}`);
});
