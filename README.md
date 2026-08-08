# TARIM OS V7.3 - Imperial Sovereign OS 🐉👑🛡️

> أول نظام تشغيل إمبراطوري حضرمي سيادي - يعمل Offline + خريطة حضرموت + بث مباشر + سيادة كاملة.

![Sovereign Shield](https://img.shields.io/badge/Shield-Sovereign%20V7.3-0a0a0a?style=for-the-badge&logo=shield)
![Security](https://img.shields.io/badge/Security-Helmet%20%7C%20JWT%20%7C%20RateLimit-success?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square)
![Offline](https://img.shields.io/badge/Map-Offline%20Leaflet-2E7D32?style=flat-square)

**Live:** `https://tarim-os.yourdomain.com` | **Status:** `Production Ready V7.3` | **License:** `Sovereign`

### 🏰 المميزات السيادية - 5 أركان الدولة

1.  **الرئيسية (🏠):** نظام Reels سيادي ملء الشاشة - فيديو + لايك + تعليق + حفظ + مشاركة
2.  **العمليات (⚡):** 4 أقسام سيادية: [بث مباشر 8 دقائق حقيقي + تبديل كاميرا] [مراسلة آمنة JWT] [خريطة حضرموت Offline] [ختم QR السيادي]
3.  **الإنشاء (+):** محطة إنشاء متكاملة Fullscreen - كاميرا + رفع صور/فيديو/نص + بث
4.  **الوارد (💬):** Inbox تيك توكي - تفاعلات + إشعارات + قصاصات الجمهور
5.  **الملف (👤):** محفظة OKX مبسطة + QR + إعدادات سيادية + PWA Install

### ⚙️ التقنيات المحصنة V7.3

**الواجهة السيادية:**
- Vanilla JS + HTML5 + CSS3 - بدون React لتخفيف القلعة
- **ESM Shield:** `esm.unpkg.com?bundle&target=es2022&min` - تحميل آمن بدون npm
- PWA + Service Worker `sw.js` - يعمل بدون إنترنت

**القصر الخلفي:**
- Node.js + Express.js V4.18
- Helmet + CORS + Rate-Limit + JWT Sovereign
- Database: JSON (Dev) -> PostgreSQL (Prod)

### 📁 هيكل القلعة الحقيقي

tarim-os/
├── public/             # الواجهة الإمبراطورية
│   ├── index.html      # الهيكل V7.3 المحصن
│   ├── style.css       # الرداء الملكي
│   ├── app.js          # عقل النظام + esm.unpkg
│   ├── sw.js           # الحارس Offline
│   └── manifest.json   # وثيقة التتويج PWA
├── src/
│   ├── config/         # دستور القلعة
│   ├── middleware/     # دروع الحماية
│   └── routes/         # بوابات API
├── server.js           # القصر الرئاسي - نقطة الدخول
├── .env.example        # الدستور البيئي - بدون أسرار
└── .gitignore          # الدرع الحامي V7.3

### 🚀 التشغيل السريع - الإنتاج الحقيقي

1.  **استنساخ القلعة:**
    git clone https://github.com/your-username/tarim-os.git
    cd tarim-os

2.  **توليد مفتاح السيادة (مهم جداً):**
    openssl rand -base64 64
    # انسخ الناتج وضعه في JWT_SECRET

3.  **تثبيت الاعتماديات المحصنة:**
    npm ci  # وليس npm install - يضمن نفس البناء

4.  **تشغيل القلعة:**
    npm run dev    # للتطوير
    npm start      # للإنتاج

### 🔐 درع الحماية السيادي V7.3

- ✅ Helmet - يمنع XSS و Clickjacking
- ✅ express-rate-limit - يمنع هجوم الإغراق 100 طلب / 15 دقيقة
- ✅ JWT + bcrypt 12 rounds - تشفير ملكي
- ✅ CORS_ORIGIN محدد - لا أحد يدخل إلا بدعوة
- ✅ esm.unpkg.com?bundle&min - لا unpkg.com العادي المخترق

### 🛡️ روابط ESM المحصنة المستخدمة

# الطريقة السيادية - ملف واحد مضغوط وآمن
https://esm.unpkg.com/leaflet@1.9.4?bundle&target=es2022&min
https://esm.unpkg.com/lucide@0.400.0?bundle&target=es2022&min

### 📜 الترخيص السيادي

Sovereign License - كل الحقوق محفوظة لدولة حضرموت الرقمية 🐉👑
