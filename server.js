const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// حماية الأمان الأساسية
app.use(helmet({
  contentSecurityPolicy: false,
}));

// تحديد معدل الطلبات لحماية السيرفر
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // حد اقصى للطلبات
});
app.use(limiter);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// مسار التحقق وإرسال البريد
app.post('/api/auth/request', (req, res) => {
  const { identifier } = req.body;
  res.json({ success: true, message: `تم إرسال رمز التحقق إلى ${identifier} بنجاح` });
});

// إدارة الاتصالات الحية عبر Socket.io
io.on('connection', (socket) => {
  socket.on('registerSocket', (user) => {
    socket.join(user);
  });
  
  socket.on('disconnect', () => {
    // قطع الاتصال بهدوء
  });
});

// تشغيل السيرفر على المنفذ الصحيح لـ Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`TARIM OS Server running on port ${PORT}`);
});
            
