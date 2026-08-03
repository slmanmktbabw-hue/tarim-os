const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
const users = new Map(); // phone -> socketId
const liveRooms = new Map(); // roomId -> {host, viewers, startTime}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// صفحة واحدة فقط لتوجيه المسارات الـ SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('مستخدم متصل:', socket.id);

  // تسجيل الدخول
  socket.on('register', ({phone}) => {
    users.set(phone, socket.id);
    socket.phone = phone || 'AL';
    console.log('تم تسجيل:', phone);
  });

  // بدء البث - مفتوح للابد
  socket.on('startLive', () => {
    const roomId = 'live_' + socket.id;
    liveRooms.set(roomId, {
      host: socket.id,
      viewers: 1,
      startTime: Date.now(),
      duration: 0 
    });
    socket.join(roomId);
    socket.roomId = roomId;
    
    // عداد البث - يعد للاعلى
    const interval = setInterval(() => {
      const room = liveRooms.get(roomId);
      if(!room) return clearInterval(interval);
      const elapsed = Date.now() - room.startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      io.to(roomId).emit('liveTimer', `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`);
    }, 1000);

    socket.liveInterval = interval; 
    socket.emit('liveStarted', {roomId});
    console.log('بدأ بث:', roomId);
  });

  // الانضمام للبث
  socket.on('joinLive', (roomId) => {
    const room = liveRooms.get(roomId);
    if(room){
      room.viewers++;
      socket.join(roomId);
      io.to(roomId).emit('viewersUpdate', room.viewers);
    }
  });

  // لايك البث
  socket.on('liveLike', (roomId) => {
    if(roomId) io.to(roomId).emit('newLike', {from: socket.phone});
  });

  // تعليق البث
  socket.on('liveComment', ({roomId, text}) => {
    if(roomId) io.to(roomId).emit('newComment', {from: socket.phone || 'AL', text});
  });

  // هدية
  socket.on('sendGift', (roomId) => {
    if(roomId) io.to(roomId).emit('newGift', {from: socket.phone || 'AL'});
  });

  // ايقاف البث يدوي
  socket.on('stopLive', () => {
    if(socket.roomId){
      clearInterval(socket.liveInterval);
      io.to(socket.roomId).emit('liveEnded');
      liveRooms.delete(socket.roomId);
      console.log('تم ايقاف البث:', socket.roomId);
    }
  });

  // قطع الاتصال
  socket.on('disconnect', () => {
    if(socket.roomId){
      clearInterval(socket.liveInterval);
      const room = liveRooms.get(socket.roomId);
      if(room && room.host === socket.id){
        io.to(socket.roomId).emit('liveEnded');
        liveRooms.delete(socket.roomId);
      }
    }
    if(socket.phone) users.delete(socket.phone);
    console.log('مستخدم قطع:', socket.id);
  });

});

// تشفير بسيط للـ QR
app.post('/api/qr', (req, res) => {
  const data = JSON.stringify({user: req.body.phone || 'AL', time: Date.now()});
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  res.json({qr: hash.slice(0, 20)});
});

server.listen(PORT, () => {
  console.log(`TARIM OS V1.0 Beta شغال على http://localhost:${PORT}`);
});
