const nodemailer = preg = require('nodemailer'); // أو استدعاؤها بالطريقة العادية

// أضف هذه الإعدادات أعلى الملف أو استخدم متغيرات البيئة في Render
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL, // بريدك الإلكتروني الذي سيرسل الرسائل
    pass: process.env.SMTP_PASSWORD  // كلمة مرور التطبيق (App Password) من بريدك
  }
});

// 1. طلب التسجيل أو الدخول وتوليد وإرسال كود التحقق عبر البريد
app.post('/api/auth/request', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.json({ success: false, message: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف مع كلمة المرور' });
    }

    // توليد رمز تحقق عشوائي من 4 أرقام
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    pendingOTPs[identifier] = { otp: otpCode, password, timestamp: Date.now() };

    // إذا كان المدخل بريداً إلكترونياً، قم بإرسال الكود فعلياً
    if (identifier.includes('@')) {
      try {
        await transporter.sendMail({
          from: '"TARIM OS القلعة العالمية" <' + process.env.SMTP_EMAIL + '>',
          to: identifier,
          subject: 'رمز التحقق الخاص بك - TARIM OS',
          text: `رمز التحقق الخاص بك لدخول القلعة هو: ${otpCode}`
        });
      } catch (mailErr) {
        console.log('خطأ في إرسال البريد:', mailErr);
        return res.json({ success: false, message: 'فشل إرسال البريد الإلكتروني، تحقق من الإعدادات' });
      }
    }

    res.json({ 
      success: true, 
      requiresOTP: true,
      message: `تم إرسال رمز التحقق بنجاح إلى البريد (${identifier}).` 
    });
  } catch (e) {
    res.json({ success: false, message: 'حدث خطأ في طلب المصادقة' });
  }
});
