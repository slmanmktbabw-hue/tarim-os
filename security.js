/**
 * TARIM OS - نظام الأمان والحماية السيادية
 * الإشراف: أبو سلمان
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

function setupSecurity(app) {
    // تفعيل حماية رؤوس HTTP الأساسية
    app.use(helmet({
        contentSecurityPolicy: false, // مسموح لتحميل السكربتات والخرائط بسلاسة
    }));

    // درع الحماية ضد هجمات التكرار والطلبات المفرطة (Rate Limiting)
    const sovereignLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 دقيقة
        max: 200, // الحد الأقصى للطلبات لكل آيبี
        message: {
            status: 429,
            error: "⚠️ تنبيه سيادي: تم اكتشاف طلبات متكررة مشبوهة، تم تفعيل درع الحماية المؤقت."
        },
        standardHeaders: true,
        legacyHeaders: false,
    });

    // تطبيق الدرع على مسارات النظام
    app.use(sovereignLimiter);

    console.log("🛡️ تم تفعيل درع الأمان والحماية السيادية بنجاح.");
}

module.exports = setupSecurity;

