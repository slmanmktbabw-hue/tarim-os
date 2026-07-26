const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// خدمة الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// مسار رئيسي للتأكد من عمل السيرفر السيادي
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل نظام المراسلة الحية Socket.IO
io.on('connection', (socket) => {
  console.log('🔗 مستخدم سيادي متصل:', socket.id);
  
  socket.on('message', (data) => {
    io.emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ انقطع اتصال المستخدم:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`👑 القلعة السيادية TARIM OS تعمل بقوة على المنفذ: ${PORT}`);
});
