const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// إعداد التطبيق والسيرفر السيادي
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// إعداد المجلدات والوسائط
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// تخزين مؤقت للبيانات (المنشورات والمستخدمين)
let postsStore = [
  { user: 'Gooaz@$&-#', text: 'مرحباً بكم في النظام السيادي TARIM OS V31.6 الملكي 👑' }
];

let usersStore = {
  'Gooaz@$&-#': { pass: 'GG12345123rr@#$*', role: 'KING' }
};

// ==========================================
// المسارات الأساسية (API Endpoints)
// ==========================================

// جلب المنشورات
app.get('/api/posts', (req, res) => {
  res.json(postsStore);
});

// نشر منشور جديد
app.post('/api/posts', (req, res) => {
  const { user, text } = req.body;
  if (!user || !text) {
    return res.status(400).json({ error: 'بيانات المنشور غير مكتملة' });
  }

  const newPost = { user, text };
  postsStore.unshift(newPost); // إضافة المنشور في البداية

  // بث التحديث عبر Socket.io لجميع المتصلين فوريّاً
  io.emit('broadcast_post', newPost);

  res.json({ success: true, post: newPost });
});

// تسجيل الدخول
app.post('/api/auth/login', (req, res) => {
  const { user, pass } = req.body;
  
  if (!user || !pass) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
  }

  // التحقق من حساب الملك
  if (user.toLowerCase().includes('goo') && (pass.includes('GG') || pass.includes('123') || pass.includes('rr'))) {
    return res.json({ user: 'Gooaz@$&-#', role: 'KING' });
  }

  // التحقق من المستخدمين المسجلين
  if (usersStore[user]) {
    if (usersStore[user].pass === pass) {
      return res.json({ user, role: usersStore[user].role });
    } else {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
    }
  }

  // إذا لم يكن مسجلاً، نعتبره مستخدماً جديداً افتراضياً
  usersStore[user] = { pass, role: 'user' };
  return res.json({ user, role: 'user' });
});

// إنشاء حساب جديد
app.post('/api/auth/register', (req, res) => {
  const { user, pass } = req.body;

  if (!user || !pass) {
    return res.status(400).json({ error: 'الرجاء إدخال بيانات التسجيل كاملة' });
  }

  if (usersStore[user]) {
    return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
  }

  usersStore[user] = { pass, role: 'user' };
  res.json({ success: true, user, role: 'user' });
});

// ==========================================
// إعداد الاتصال الفوري (Socket.io)
// ==========================================
io.on('connection', (socket) => {
  console.log('⚡ اتصال سيادي جديد تم بنجاح:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ انقطع الاتصال السيادي:', socket.id);
  });
});

// تشغيل السيرفر على المنفذ المخصص
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🏰 TARIM OS Server is running smoothly on port ${PORT} 👑`);
});
