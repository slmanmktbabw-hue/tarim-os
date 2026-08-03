const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const users = new Map(); // socketId -> username
const liveRooms = new Map(); // roomId -> {host, viewers, startTime}

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 1. الاتصال بقاعدة البيانات
const db = new sqlite3.Database('./tarim_os.db', (err) => {
    if (err) console.error('❌ خطأ في قاعدة البيانات', err.message);
    else console.log('✅ تم الاتصال بقاعدة بيانات Tarim OS بنجاح.');
});

// 2. انشاء الجداول لو مش موجودة
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    okki_balance REAL DEFAULT 0,
    followers INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    posts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// 3. API انشاء حساب جديد
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username ||!password) {
        return res.status(400).json({ success: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?,?)`, [username, hashedPassword], function(err) {
            if (err) return res.status(400).json({ success: false, message: 'اسم المستخدم موجود مسبقاً!' });
            res.json({
                success: true,
                message: 'تم إنشاء الحساب بنجاح',
                user: { username, okki_balance: 0, followers: 0, likes: 0, posts: 0 }
            });
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

// 4. API تسجيل دخول
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username =?`, [username], async (err, user) => {
        if (err ||!user) return res.status(400).json({ success: false, message: 'المستخدم غير موجود!' });
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ success: false, message: 'كلمة المرور غير صحيحة!' });

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            user: { username: user.username, okki_balance: user.okki_balance, followers: user.followers, likes: user.likes, posts: user.posts }
        });
    });
});

// 5. API انشاء QR
app.post('/api/qr', (req, res) => {
  const data = JSON.stringify({user: req.body.phone, time: Date.now()});
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  res.json({qr: hash.slice(0, 20)});
});

// 6. Socket.io للبث
io.on('connection', (socket) => {
  console.log('مستخدم متصل:', socket.id);

  socket.on('registerSocket', (username) => {
    users.set(socket.id, username);
    socket.username = username;
    console.log('تم ربط السوكت:', username);
  });

  socket.on('startLive', () => {
    const roomId = 'live_' + socket.id;
    liveRooms.set(roomId, { host: socket.id, viewers: 1, startTime: Date.now() });
    socket.join(roomId);
    socket.roomId = roomId;

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

  socket.on('joinLive', (roomId) => {
    const room = liveRooms.get(roomId);
    if(room){ room.viewers++; socket.join(roomId); io.to(roomId).emit('viewersUpdate', room.viewers); }
  });

  socket.on('liveLike', (roomId) => io.to(roomId).emit('newLike', {from: socket.username}));
  socket.on('liveComment', ({roomId, text}) => io.to(roomId).emit('newComment', {from: socket.username, text}));
  socket.on('sendGift', (roomId) => io.to(roomId).emit('newGift', {from: socket.username}));

  socket.on('stopLive', () => {
    if(socket.roomId){
      clearInterval(socket.liveInterval);
      io.to(socket.roomId).emit('liveEnded');
      liveRooms.delete(socket.roomId);
      console.log('تم ايقاف البث:', socket.roomId);
    }
  });

  socket.on('disconnect', () => {
    if(socket.roomId){
      clearInterval(socket.liveInterval);
      const room = liveRooms.get(socket.roomId);
      if(room && room.host === socket.id){
        io.to(socket.roomId).emit('liveEnded');
        liveRooms.delete(socket.roomId);
      }
    }
    users.delete(socket.id);
    console.log('مستخدم قطع:', socket.id);
  });
});

// صفحة واحدة SPA - لازم تكون اخر شي
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`TARIM OS V1.0 Beta شغال على http://localhost:${PORT}`);
});
