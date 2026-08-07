// security.js - TARIM OS Royal Security Shield - PRODUCTION READY
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 1. الدرع العام - ضد هجمات DDoS للـ API
const sovereignLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 300, // 300 طلب لكل IP - كافي للفيديو والتصفح
    message: {
        success: false,
        message: "تنبيه سيادي: تم تجاوز حد الطلبات. تم تفعيل الحماية مؤقتاً."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. الدرع الخاص - ضد تخمين كلمات السر Brute Force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 10, // فقط 10 محاولات تسجيل دخول
    message: {
        success: false,
        message: "محاولات دخول كثيرة جداً. تم قفل البوابة 15 دقيقة."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. خوذة الحماية الملكية - محصنة وتسمح بالفيديو والخريطة
const helmetShield = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.socket.io"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
            mediaSrc: ["'self'", "blob:", "data:"],
            connectSrc: ["'self'", "ws:", "wss:", "https://*.tile.openstreetmap.org"],
            frameAncestors: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false, // مهم للفيديو والخريطة
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

// 4. ختم السيادة الإضافي
function sovereignHeaders(req, res, next) {
    res.setHeader('X-Sovereign-Shield', 'TARIM-OS-Active-1.0-Imperial');
    res.setHeader('X-Powered-By', 'TARIM OS Sovereign Engine');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    // X-XSS-Protection قديم وتم الاستغناء عنه بـ CSP
    next();
}

// 5. دالة التهيئة الشاملة - متوافقة مع server.js القديم والجديد
function royalSecurityMiddleware(req, res, next) {
    return sovereignHeaders(req, res, next);
}

royalSecurityMiddleware.setup = function(app) {
    // الترتيب مهم جداً: helmet أولاً
    app.use(helmetShield);
    app.use(sovereignHeaders);
    // الحماية من الإغراق
    app.use('/api/', sovereignLimiter);
    app.use('/api/login', authLimiter);
};

royalSecurityMiddleware.sovereignLimiter = sovereignLimiter;
royalSecurityMiddleware.authLimiter = authLimiter;
royalSecurityMiddleware.helmetShield = helmetShield;

module.exports = royalSecurityMiddleware;
