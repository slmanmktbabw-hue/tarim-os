// security.js - Royal Security Middleware & DDoS Shield
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// محدد معدل الطلبات لصد هجمات الـ DDoS والحماية السيادية
const sovereignLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 300, // حد الطلبات المسموح به لكل IP
    message: {
        success: false,
        message: "⚠️ تنبيه سيادي: تم تجاوز حد الطلبات المسموح به. تم حظر الاتصال مؤقتاً لحماية قلعة تريم."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// دعم الطريقتين (سواء تم استدعاؤه كدالة تأخذ app أو كـ middleware مباشر)
function royalSecurityMiddleware(req, res, next) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Sovereign-Shield', 'TARIM-OS-Active-1.0');
    next();
}

// دالة التهيئة الشاملة المتوافقة مع server.js
royalSecurityMiddleware.setup = function(app) {
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));
    app.use('/api/', sovereignLimiter);
    app.use(royalSecurityMiddleware);
};

module.exports = royalSecurityMiddleware;
