// security.js - TARIM OS V7.4 - ROYAL SHIELD HARDENED
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

function checkSovereignKey() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ [FATAL] JWT_SECRET مفقود في الإنتاج - إيقاف القلعة');
            process.exit(1);
        } else {
            console.warn('⚠️ [DEV] استخدام مفتاح تطوير مؤقت');
            process.env.JWT_SECRET = 'DEV-ONLY-' + crypto.randomBytes(32).toString('hex');
        }
    } else if (secret.length < 64) {
        console.error('❌ [FATAL] JWT_SECRET قصير جداً - يجب أن يكون 64 محرف على الأقل');
        process.exit(1);
    } else {
        console.log('✅ [SECURITY V7.4] JWT_SECRET فعال - الدرع نشط');
    }
}
checkSovereignKey();

// 1. الدرع العام - 100 طلب / 15 دقيقة - مع مفتاح آمن لا يمكن تزويره
const sovereignLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "🛡️ تم تجاوز الحد المسموح - حاول بعد 15 دقيقة" },
    standardHeaders: true,
    legacyHeaders: false,
    // الحل الصحيح لتزوير IP خلف Cloudflare/Render
    keyGenerator: (req) => {
        // خذ أول IP حقيقي فقط بعد الوثوق بالبروكسي
        const ip = req.ip || req.headers['cf-connecting-ip'] || 'unknown';
        return ip;
    },
    // لا تتجاوز الـ rate limit أبداً - حتى /status يجب أن يكون محمي
    skip: (req) => false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "🔐 بوابة مقفلة 15 دقيقة - محاولات كثيرة" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const ip = req.ip || req.headers['cf-connecting-ip'] || 'unknown';
        const user = req.body?.username?.slice(0, 50) || 'no-user';
        return `${ip}|${user}`; // قفل لكل IP + اسم مستخدم
    }
});

// 2. خوذة Helmet V7.4 - محصنة 100%
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://tarimos.org';

const helmetShield = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "https://esm.unpkg.com",
                "https://esm.sh"
                // لا يوجد unsafe-inline أبداً
            ],
            styleSrc: [
                "'self'",
                "https://fonts.googleapis.com",
                "https://esm.unpkg.com"
                // تم حذف unsafe-inline - ثغرة XSS
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: [
                "'self'",
                "data:",
                "https://*.tile.openstreetmap.org"
                // تم حذف blob: و opentopomap - تقليل السطح
            ],
            mediaSrc: ["'self'", "blob:"], // blob مسموح فقط للكاميرا المحلية
            connectSrc: [
                "'self'",
                ALLOWED_ORIGIN,
                "https://esm.unpkg.com",
                "https://esm.sh"
                // تم حذف ws: wss: المفتوحة - كانت تسمح لأي موقع بسرقة الـ socket
            ],
            workerSrc: ["'self'", "blob:"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            objectSrc: ["'none'"], // منع Flash/Java القديم
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: true, // كان false - ثغرة
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-site" }, // كان cross-origin - ثغرة
    hsts: {
        maxAge: 63072000, // سنتين
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true // يحذف X-Powered-By نهائياً
});

// 3. ختم السيادة - بدون تسريب معلومات
function sovereignHeaders(req, res, next) {
    // لا تكشف إصدارك أبداً - احذف هذه الرؤوس
    res.removeHeader('X-Powered-By');
    // res.setHeader('X-Sovereign-Shield',...) <- احذفه، يكشف نظامك
    // res.setHeader('X-Tarim-Version',...) <- احذفه، يعطي المهاجم رقم الإصدار

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // أقل صلاحيات ممكنة - لا تفتح الكاميرا لكل الصفحات
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
}

function royalSecurityMiddleware(req, res, next) {
    return sovereignHeaders(req, res, next);
}

royalSecurityMiddleware.setup = function(app) {
    // أهم سطر - يجب أن يكون أول شيء قبل أي rate limit
    const trustProxyCount = process.env.TRUST_PROXY? parseInt(process.env.TRUST_PROXY) : 1;
    app.set('trust proxy', trustProxyCount);

    app.use(helmetShield);
    app.use(sovereignHeaders);

    // تطبيق الدرع العام على كل الـ API بدون استثناء
    app.use('/api/', sovereignLimiter);
    app.use('/api/login', authLimiter);

    console.log('🛡️ [V7.4 HARDENED] الدرع مفعل - Helmet Strict - RateLimit 100/5 - No Info Leak');
};

royalSecurityMiddleware.sovereignLimiter = sovereignLimiter;
royalSecurityMiddleware.authLimiter = authLimiter;
royalSecurityMiddleware.helmetShield = helmetShield;

module.exports = royalSecurityMiddleware;
