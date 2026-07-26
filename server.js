const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// تقديم الملفات الثابتة من مجلد public ليعمل التطبيق كـ PWA حقيقي
app.use(express.static(path.join(__dirname, 'public')));

// مسار تجريبي لجلب المهام الحقيقية للنظام
app.get('/api/tasks', (req, res) => {
    res.json([
        { id: 1, title: 'بث مباشر سيادي ومشفر (8 دقائق)', status: 'نشط', priority: 'عالية' },
        { id: 2, title: 'المراسلة والاتصال الآمن بين الحسابات', status: 'محمي', priority: 'قصوى' }
    ]);
});

// إدارة اتصالات Socket.io الحية لغرفة العمليات والمراسلة
io.on('connection', (socket) => {
    console.log('🔗 تم اتصال عميل سيادي جديد بالنظام');

    socket.on('message', (data) => {
        // بث الرسالة لجميع المتصلين في الغرفة السيادية الحية
        io.emit('message', data);
    });

    socket.on('disconnect', () => {
        console.log('disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🏰 TARIM OS v14.3 يعمل بكامل طاقته على المنفذ: ${PORT}`);
});
