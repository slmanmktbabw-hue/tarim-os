const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات مرتبة للجمهور (تخزين الحسابات والرموز المؤقتة)
let audienceDB = {}; // مفتاحها البريد أو الهاتف
let pendingOTPs = {}; // لحفظ رمز التحقق المؤقت

// حساب الملك الأساسي المعتمد مسبقاً
const MASTER_USER = "Gooaz@$&-#";
const MASTER_PASS_HASH = bcrypt.hashSync("GG12345123rr@#$*", 10);
audienceDB[MASTER_USER] = {
  identifier: MASTER_USER,
  password: MASTER_PASS_HASH,
  type: 'master',
  verified: true,
  okki_balance: 500,
  followers: 25,
  likes: 120,
  posts: 5
};

// 1. طلب التسجيل أو الدخول عبر (البريد أو الهاتف) وتوليد كود التحقق OTP
app.post('/api/auth/request', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.json({ success: false, message: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف مع كلمة المرور' });
    }

    // توليد رمز تحقق عشوائي من 4 أرقام
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    pendingOTPs[identifier] = { otp: otpCode, password, timestamp: Date.now() };

    // محاكاة إرسال الكود (في البيئة الحقيقية يتم ربطه بـ SMS أو Email Gateway)
    console.log(`🔐 [رمز التحقق العالمي] للمعرف (${identifier}) هو: ${otpCode}`);

    res.json({ 
      success: true, 
      requiresOTP: true,
      message: `تم إرسال رمز التحقق بنجاح إلى (${identifier}). (رمز التجربة في الكونسول: ${otpCode})` 
    });
  } catch (e) {
    res.json({ success: false, message: 'حدث خطأ في طلب المصادقة' });
  }
});

// 2. تأكيد رمز التحقق (OTP) وإنشاء الحساب أو تسجيل الدخول وترتيب الجمهور
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const pending = pendingOTPs[identifier];

    if (!pending || pending.otp !== otp) {
      return res.json({ success: false, message: '❌ رمز التحقق غير صحيح أو انتهت صلاحيته' });
    }

    let user = audienceDB[identifier];
    if (!user) {
      // إنشاء حساب جديد وترتيبه في قاعدة بيانات الجمهور العالمية
      const hashedPassword = await bcrypt.hash(pending.password, 10);
      user = {
        identifier,
        password: hashedPassword,
        type: identifier.includes('@') ? 'email' : 'phone',
        verified: true,
        okki_balance: 100,
        followers: 1,
        likes: 10,
        posts: 0
      };
      audienceDB[identifier] = user;
    }

    delete pendingOTPs[identifier]; // مسح الرمز بعد الاستخدام

    res.json({
      success: true,
      user: {
        username: user.identifier,
        okki_balance: user.okki_balance,
        followers: user.followers,
        likes: user.likes,
        posts: user.posts
      },
      message: '✅ تم التحقق ودخول القلعة بنجاح'
    });
  } catch (e) {
    res.json({ success: false, message: 'خطأ في عملية التحقق من الرمز' });
  }
});

app.post('/api/qr', (req, res) => {
  const { phone } = req.body;
  res.json({ success: true, qr: `TARIM-OS-GLOBAL-AUDIENCE-${phone || 'Gooaz'}` });
});

io.on('connection', (socket) => {
  socket.on('registerSocket', (username) => {
    if(username) socket.join(username);
  });
});

server.listen(PORT, () => {
  console.log(`🌍 منصة TARIM OS العالمية للجمهور تعمل بكفاءة على البورت: ${PORT}`);
});
