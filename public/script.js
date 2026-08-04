/**
 * TARIM OS - النظام السيادي والإمبراطوري (Backend / Server Script)
 * إشراف: الملك والإمبراطور AL - تعز
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// تفعيل الملفات الثابتة
app.use(express.static(path.join(__dirname, '.')));

// قاعدة بيانات مؤقتة لتخزين جلسات المستخدمين والمتصلين
const activeUsers = new Map();
const activeRooms = new Map();

io.on('connection', (socket) => {
    console.log(`🔌 تم اتصال عميل سيادي جديد بالبث: ${socket.id}`);

    // تسجيل المستخدم في النظام برقم هاتفه أو بريده
    socket.on('registerSocket', (identifier) => {
        activeUsers.set(socket.id, identifier);
        console.log(`👤 تم تسجيل الهوية السيادية: ${identifier} (Socket ID: ${socket.id})`);
    });

    // استقبال وإذاعة تعليقات البث المباشر لجميع الحاضرين
    socket.on('liveComment', (data) => {
        console.log(`💬 تعليق في البث من [${data.user}]: ${data.msg}`);
        // بث التعليق فوراً لكل المتصلين في المنصة
        io.emit('newLiveComment', {
            user: data.user,
            msg: data.msg,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // إدارة اللايكات والتفاعلات الحية في البث
    socket.on('liveLike', (data) => {
        io.emit('newLiveLike', {
            user: data.user || 'مستخدم سيادي'
        });
    });

    // إدارة الهدايا السيادية في البث المباشر
    socket.on('liveGift', (data) => {
        console.log(`🎁 هدية سيادية مرسلة من [${data.user}]: ${data.gift}`);
        io.emit('newLiveGift', {
            user: data.user,
            gift: data.gift
        });
    });

    // إدارة الرسائل الآمنة في صندوق الوارد (Inbox)
    socket.on('inboxMessage', (data) => {
        io.emit('newInboxMessage', data);
    });

    // قطع الاتصال وخروج المستخدم
    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);
        activeUsers.delete(socket.id);
        console.log(`❌ انقطع اتصال العميل السيادي: ${user || socket.id}`);
    });
});

// تشغيل الخادم على المنفذ 3000 أو المنفذ الافتراضي للاستضافة
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🏰 خادم TARIM OS السيادي يعمل بكامل طاقته على المنفذ: ${PORT}`);
    console.log(`👑 بإشراف الملك والإمبراطور AL - تعز`);
});
