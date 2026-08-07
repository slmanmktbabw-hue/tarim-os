// settings.js - TARIM OS Sovereign Brain - PRODUCTION READY - IMMUTABLE
require('dotenv').config();

const crypto = require('crypto');

// دالة تقرأ من.env مع قيمة احتياطية آمنة
function env(key, fallback) {
    return process.env[key] || fallback;
}

const settings = {
    // 1. معلومات النظام - ثابتة
    system: {
        name: "TARIM OS",
        fullName: "من تريم إلى العالم",
        version: "1.0.0 Imperial",
        build: "2026.05.12-Sovereign",
        sovereign: "AL",
        emperorName: "أبو سلمان",
    },

    // 2. الموقع السيادي - تريم حضرموت - ثابت لا يتغير
    location: {
        city: "Tarim",
        region: "Hadhramaut",
        country: "YE",
        coords: [16.0500, 48.9833],
        lat: 16.05,
        lng: 48.9833
    },

    // 3. المنصة - تقرأ من.env الآن - لا تضارب
    platform: {
        port: parseInt(env('PORT', '10000'), 10),
        env: env('NODE_ENV', 'production'),
        domain: env('CORS_ORIGIN', 'https://tarimos.org'),
        isProduction: env('NODE_ENV', 'production') === 'production'
    },

    // 4. إعدادات البث المباشر الملكي
    live: {
        maxDurationMinutes: 8,
        maxDurationSeconds: 8 * 60,
        autoStop: true,
        enableChat: true,
        enableLikes: true,
        enableGifts: false // معطل حتى تفعيل الدفع
    },

    // 5. الكاميرا السيادية
    camera: {
        defaultFacing: "environment",
        enableTorch: true,
        enableSwitch: true
    },

    // 6. خريطة حضرموت Offline
    map: {
        provider: "Offline Leaflet",
        defaultZoom: 13,
        defaultCenter: [16.0500, 48.9833],
        offlineCache: true,
        tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© TARIM OS Sovereign Map | OSM"
    },

    // 7. محفظة OKX
    okx: {
        initialBalance: 1000,
        currency: "TARIM",
        // توليد محفظة وهمية آمنة عند الطلب
        generateWallet: () => `0x53${crypto.randomBytes(16).toString('hex').slice(0, 4)}...${crypto.randomBytes(2).toString('hex')}`
    },

    // 8. الأمان السيادي - يقرأ من وزارة الدفاع security.js
    security: {
        jwtSecret: env('JWT_SECRET', null), // لا يوجد احتياطي - يجب أن يكون في.env
        jwtExpiresIn: env('JWT_EXPIRES_IN', '7d'),
        rateLimitGlobal: 300,
        rateLimitLogin: 10,
        helmetEnabled: true
    },

    // 9. عين الذكاء الاصطناعي
    aiEye: {
        offline: true,
        model: "TarimAI v1 Sovereign",
        language: "ar",
        version: "1.0"
    }
};

// 10. تحصين العقل - ممنوع التعديل بعد التحميل - Immutable
// أي محاولة لتغيير settings.system.name = "HACKED" ستفشل
Object.freeze(settings);
Object.freeze(settings.system);
Object.freeze(settings.location);
Object.freeze(settings.platform);
Object.freeze(settings.live);
Object.freeze(settings.security);

// 11. فحص أمني عند الإقلاع
if (!settings.security.jwtSecret) {
    console.error('☠️ [TARIM BRAIN] JWT_SECRET مفقود في.env - العقل يرفض العمل بدون مفتاح سيادي');
    if (settings.platform.isProduction) {
        // في الإنتاج لا نعمل بدون مفتاح
        process.exit(1);
    }
}

module.exports = settings;
