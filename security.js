// security.js - TARIM OS V7.3.1 FINAL SEAL - Royal Security Shield - ESM Shield
// 🐉◈⚖️👑 esm.unpkg.com?bundle&target=es2022&min - FINAL SEAL
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

// 0. فحص المفتاح السيادي - إصلاح سقوط Render
function checkSovereignKey() {
    if (!process.env.JWT_SECRET) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('⚠️ [TARIM SECURITY WARN] JWT_SECRET غير موجود في Render - توليد مؤقت - ضعه في Environment Variables فوراً!');
            console.warn('⚠️ اذهب إلى Render Dashboard > Environment > JWT_SECRET');
            process.env.JWT_SECRET = crypto.randomBytes(64).toString('base64');
            console.log('🔑 [TARIM SECURITY] تم توليد مفتاح مؤقت - السيرفر سيعمل لكن ضع واحد ثابت!');
        } else {
            console.warn('⚠️ [DEV] JWT_SECRET غير موجود - استخدام مفتاح تطوير');
            process.env.JWT_SECRET = 'DEV-TARIM-OS-V7-3-1-FINAL-SEAL-LOCAL-ONLY-' + crypto.randomBytes(16).toString('hex');
        }
    } else {
        console.log('✅ [TARIM SECURITY] JWT_SECRET موجود - الدرع فعال V7.3.1');
    }
}
checkSovereignKey();

// 1. الدرع العام V7.3.1 - 150 طلب / 15 دقيقة
const sovereignLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: {
        success: false,
        message: "🛡️ تنبيه سيادي V7.3.1 FINAL: تم تفعيل الدرع - انتظر دقيقة - ESM Shield"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/status' || req.path === '/api/health',
});

// 2. الدرع الخاص - 5 محاولات دخول فقط
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "🔐 بوابة الإمبراطور مقفلة 15 دقيقة V7.3.1 - محاولات كثيرة"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. خوذة Helmet V8 الملكية - esm.unpkg.com فقط - لا cdnjs ولا unpkg العادي
const helmetShield = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://esm.unpkg.com",
                "https://esm.sh",
                "blob:"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://esm.unpkg.com",
                "https://fonts.googleapis.com"
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
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
            connectSrc: [
                "'self'",
                "ws:",
                "wss:",
                "https://esm.unpkg.com",
                "https://esm.sh",
                "https://*.tile.openstreetmap.org",
                "https://tarim-os.onrender.com"
            ],
            workerSrc: ["'self'", "blob:"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// 4. ختم السيادة V7.3.1 FINAL SEAL
function sovereignHeaders(req, res, next) {
    res.setHeader('X-Sovereign-Shield', 'TARIM-OS-V7.3.1-FINAL-SEAL-ESM-SHIELD-ACTIVE');
    res.setHeader('X-Powered-By', 'TARIM OS V7.3.1 FINAL SEAL Sovereign Engine');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
    res.setHeader('X-Tarim-Version', 'V7.3.1-FINAL-SEAL');
    next();
}

// 5. التهيئة الشاملة - الترتيب الصحيح
function royalSecurityMiddleware(req, res, next) {
    return sovereignHeaders(req, res, next);
}

royalSecurityMiddleware.setup = function(app) {
    app.use(helmetShield);
    app.use(sovereignHeaders);
    app.use('/api/', sovereignLimiter);
    app.use('/api/login', authLimiter);
    app.use('/api/posts', sovereignLimiter);
    console.log('🛡️ [TARIM SECURITY V7.3.1] الدرع مفعل - ESM Shield - RateLimit 150/5 - Helmet V8 - FINAL SEAL');
};

royalSecurityMiddleware.sovereignLimiter = sovereignLimiter;
royalSecurityMiddleware.authLimiter = authLimiter;
royalSecurityMiddleware.helmetShield = helmetShield;

module.exports = royalSecurityMiddleware;
