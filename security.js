// security.js - TARIM OS V7.3 Royal Security Shield - IMPERIAL SOVEREIGN
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 1. الدرع العام V7.3 - محصن ضد DDoS
const sovereignLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150, // خفضناها من 300 إلى 150 - حماية لقاعدة JSON
    message: {
        success: false,
        message: "🛡️ تنبيه سيادي V7.3: تم تفعيل الدرع - انتظر دقيقة"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/status', // حالة النظام لا تحسب
});

// 2. الدرع الخاص - ضد تخمين كلمات السر - 5 محاولات فقط
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // كان 10 - الآن 5 فقط - أكثر سيادية
    message: {
        success: false,
        message: "🔐 بوابة الإمبراطور مقفلة 15 دقيقة - محاولات كثيرة"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. خوذة الحماية الملكية V7.3 - محصنة بـ esm.unpkg.com السيادي
const helmetShield = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // ✅ الإصلاح السيادي - esm.unpkg.com فقط المحصن
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // ضروري لـ Vanilla JS بدون build
                "https://esm.unpkg.com", // ✅ الدرع الجديد المحصن ?bundle&target=es2022&min
                "https://esm.sh", // احتياطي سيادي
                "blob:" // للبث المباشر
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://esm.unpkg.com",
                "https://fonts.googleapis.com"
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            // ✅ خريطة حضرموت Offline + صور
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://*.tile.openstreetmap.org",
                "https://esm.unpkg.com",
                "https://*.tile.openstreetmap.fr",
                "https://*.tile.opentopomap.org"
            ],
            mediaSrc: ["'self'", "blob:", "data:"],
            // ✅ السماح لـ esm.unpkg.com بجلب الحزم
            connectSrc: [
                "'self'",
                "ws:",
                "wss:",
                "https://esm.unpkg.com",
                "https://esm.sh",
                "https://*.tile.openstreetmap.org"
            ],
            workerSrc: ["'self'", "blob:"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false, // مهم للفيديو
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// 4. ختم السيادة V7.3
function sovereignHeaders(req, res, next) {
    res.setHeader('X-Sovereign-Shield', 'TARIM-OS-V7.3-ESM-SHIELD-ACTIVE');
    res.setHeader('X-Powered-By', 'TARIM OS V7.3 Sovereign Engine - esm.unpkg.com Shield');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
    next();
}

// 5. التهيئة الشاملة V7.3
function royalSecurityMiddleware(req, res, next) {
    return sovereignHeaders(req, res, next);
}

royalSecurityMiddleware.setup = function(app) {
    // الترتيب السيادي الصحيح: helmet أولاً ثم الأختام ثم Rate Limit
    app.use(helmetShield);
    app.use(sovereignHeaders);
    app.use('/api/', sovereignLimiter);
    app.use('/api/login', authLimiter);
    // حماية إضافية لباقي البوابات الحساسة
    app.use('/api/posts', sovereignLimiter);
};

royalSecurityMiddleware.sovereignLimiter = sovereignLimiter;
royalSecurityMiddleware.authLimiter = authLimiter;
royalSecurityMiddleware.helmetShield = helmetShield;

module.exports = royalSecurityMiddleware;
