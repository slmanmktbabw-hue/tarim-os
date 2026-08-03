const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcrypt'); // مكتبة التشفير السيادي

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات آمنة (تم إعدادها لتخزين كلمات المرور مشفرة)
let users = {};

// 1. مسار تسجيل حساب جديد مع تشفير كلمة المرور
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    if (users[username]) {
      return res.json({ success: false, message: 'اسم المستخدم مسجل مسبقاً' });
    }

    // تشفير كلمة المرور بقوة 10 جولات (Salt Rounds) لمنع أي اختراق
    const hashedPassword = await bcrypt.hash(password, 10);

    users[username] = {
      username,
      password: hashedPassword, // تخزين الـ Hash فقط وليس كلمة المرور النصية
      okki_balance: 100,
      followers: 10,
      likes: 120,
      posts: 2
    };

    res.json({ 
      success: true, 
      user: { username, okki_balance: 100, followers: 10, likes: 120, posts: 2 },
      message: 'تم إنشاء الحساب وتشفيره بنجاح 🛡️' 
    });
  } catch (error) {
    res.json({ success: false, message: 'خطأ داخلي في نظام التشفير' });
  }
});

// 2. مسار تسجيل الدخول الآمن والتحقق من المطابقة
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: 'يرجى إدخال البيانات كاملة' });
    }

    const user = users[username];
    if (!user) {
      return res.json({ success: false, message: 'الحساب غير موجود' });
    }

    // مقارنة كلمة المرور المدخلة مع التشفير المحفوظ في القاعدة
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }

    res.json({ 
      success: true, 
      user: { 
        username: user.username, 
        okki_balance: user.okki_balance, 
        followers: user.followers, 
        likes: user.likes, 
        posts: user.posts 
      },
      message: 'تم تسجيل الدخول بأمان تام' 
    });
  } catch (error) {
    res.json({ success: false, message: 'خطأ في عملية التحقق' });
  }
});

// مسار الـ QR الميداني
app.post('/api/qr', (req, res) => {
  const { phone } = req.body;
  res.json({ success: true, qr: `TARIM-OS-SECURE-AUTH-${phone || 'Gooaz'}` });
});

io.on('connection', (socket) => {
  socket.on('registerSocket', (username) => {
    if(username) socket.join(username);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 TARIM OS يعمل بحماية فائقة وتشفير تام على البورت: ${PORT}`);
});
