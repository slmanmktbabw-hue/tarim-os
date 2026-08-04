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

// تفعيل قراءة البيانات وحماية السيرفر
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.status(200).send('TARIM OS Server is running smoothly 🚀');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`🔌 اتصال سيادي جديد - السوكيت: ${socket.id}`);

  socket.on('registerSocket', (userEmail) => {
    socket.userEmail = userEmail;
    console.log(`👤 تم ربط المستخدم: ${userEmail} - ${socket.id}`);
    socket.broadcast.emit('userJoined', userEmail);
  });

  socket.on('liveComment', (data) => {
    io.emit('newLiveComment', data);
  });

  socket.on('liveLike', (data) => {
    io.emit('newLiveLike', data);
  });

  socket.on('liveGift', (data) => {
    io.emit('newLiveGift', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 تم إنهاء الاتصال: ${socket.id}`);
    if(socket.userEmail){
      console.log(`👋 خروج المستخدم: ${socket.userEmail}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ خادم منصة TARIM OS السيادية يعمل الآن على المنفذ: ${PORT}`);
  console.log(`🏰 TARIM OS - tarimos.org - النظام الإمبراطوري`);
});
