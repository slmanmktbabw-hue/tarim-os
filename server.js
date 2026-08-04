const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// تقديم الملفات الثابتة (HTML, CSS, JS) من مجلد public مباشرة
app.use(express.static(path.join(__dirname, 'public')));

// مسار رئيسي اختباري للتأكد من عمل السيرفر
app.get('/health', (req, res) => {
  res.status(200).send('TARIM OS Server is running smoothly 🚀');
});

// إدارة الاتصالات الحية عبر Socket.io
io.on('connection', (socket) => {
  console.log(`🔌 اتصال جديد تم بنجاح - معرف السوكيت: ${socket.id}`);

  // تسجيل المستخدم بريده أو معرفه الخاص
  socket.on('registerSocket', (userEmail) => {
    socket.userEmail = userEmail;
    console.log(`👤 تم ربط السوكيت بالمستخدم: ${userEmail}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 تم إنهاء الاتصال: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✨ خادم منصة TARIM OS يعمل الآن على المنفذ: ${PORT}`);
});
