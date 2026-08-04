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

// تفعيل الملفات الثابتة لتخدم الواجهة الأمامية index.html
app.use(express.static(path.join(__dirname, '.')));

// تخزين المتصلين والنشاطات
const activeUsers = new Map();

io.on('connection', (socket) => {
    console.log(`🔌 تم اتصال عميل سيادي جديد بالبث: ${socket.id}`);

    // تسجيل المستخدم في النظام عبر الهوية أو البريد
    socket.on('registerUser', (userData) => {
        activeUsers.set(socket.id, userData);
        console.log(`👤 تم تسجيل الهوية السيادية: ${userData.email} (Socket ID: ${socket.id})`);
    });

    // استقبال وإذاعة تعليقات البث المباشر لجميع الحاضرين
    socket.on('liveComment', (data) => {
        console.log(`💬 تعليق في البث من [${data.user}]: ${data.msg}`);
        io.emit('newLiveComment', {
            user: data.user,
            msg: data.msg,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // إدارة اللايكات والتفاعلات الحية في البث
    socket.on('liveLike', (data) => {
        io.emit('newLiveLike', {
            count: data.count || 1
        });
    });

    // إدارة الهدايا السيادية في البث المباشر
    socket.on('liveGift', (data) => {
        console.log(`🎁 هدية سيادية مرسلة: ${data.gift}`);
        io.emit('newLiveGift', {
            gift: data.gift
        });
    });

    // إدارة رسائل صندوق الوارد الآمن (Inbox)
    socket.on('inboxMessage', (data) => {
        console.log(`📬 رسالة واردة من [${data.sender}]: ${data.text}`);
        io.emit('newInboxMessage', data);
    });

    // قطع الاتصال وخروج المستخدم
    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);
        activeUsers.delete(socket.id);
        console.log(`❌ انقطع اتصال العميل السيادي: ${user ? user.email : socket.id}`);
    });
});

// تشغيل الخادم على المنفذ المطلوب للاستضافة (مثل Render)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🏰 خادم TARIM OS السيادي يعمل بكامل طاقته على المنفذ: ${PORT}`);
    console.log(`👑 بإشراف الملك والإمبراطور AL - تعز`);
});
