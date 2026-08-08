// settings.js - TARIM OS V7.3 Sovereign Brain - IMMUTABLE FINAL SEAL
require('dotenv').config();
const crypto = require('crypto');

function env(key, fallback = null) {
    const val = process.env[key];
    return val!== undefined && val!== ''? val : fallback;
}

function envInt(key, fallback) {
    const v = env(key, null);
    if (v === null) return fallback;
    const n = parseInt(v, 10);
    return isNaN(n)? fallback : n;
}

const settings = {
    system: {
        name: "TARIM OS",
        fullName: "من تريم إلى العالم",
        version: "7.3.0 Imperial Sovereign Final",
        build: "2026.05.13-V7.3-ESM-SHIELD",
        sovereign: "AL",
        emperorName: "أبو سلمان",
        seal: "TARIM-OS-V7.3-ESM-SHIELD-ACTIVE"
    },

    location: {
        city: "Tarim",
        region: "Hadhramaut",
        country: "YE",
        coords: [16.05, 48.9833],
        lat: 16.05,
        lng: 48.9833
    },

    platform: {
        port: envInt('PORT', 10000),
        env: env('NODE_ENV', 'production'),
        domain: (env('CORS_ORIGIN', 'https://tarimos.org').split(',')[0] || 'https://tarimos.org').trim(),
        allDomains: env('CORS_ORIGIN', 'https://tarimos.org').split(',').map(s => s.trim()),
        isProduction: env('NODE_ENV', 'production') === 'production'
    },

    live: {
        maxDurationMinutes: 8,
        maxDurationSeconds: 8 * 60,
        autoStop: true,
        enableChat: true,
        enableLikes: true,
        enableGifts: false
    },

    camera: {
        defaultFacing: "environment",
        enableTorch: true,
        enableSwitch: true
    },

    map: {
        provider: "Offline Leaflet V7.3",
        defaultZoom: 13,
        defaultCenter: [16.05, 48.9833],
        offlineCache: true,
        tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        fallbackTileUrl: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attribution: "© TARIM OS V7.3 Sovereign Map | OSM"
    },

    // ✅ الإضافة السيادية الجديدة - روابط esm.unpkg.com المحصنة
    esm: {
        shield: "esm.unpkg.com",
        target: "es2022",
        bundle: true,
        min: true,
        // الروابط المحصنة الجاهزة للواجهة
        imports: {
            "leaflet": "https://esm.unpkg.com/leaflet@1.9.4?bundle&target=es2022&min",
            "lucide": "https://esm.unpkg.com/lucide@0.400.0?bundle&target=es2022&min",
            "socket.io-client": "https://esm.unpkg.com/socket.io-client@4.8.1?bundle&target=es2022&min"
        },
        css: {
            "leaflet": "https://esm.unpkg.com/leaflet@1.9.4?bundle&target=es2022&min&css"
        }
    },

    okx: {
        initialBalance: 1000,
        currency: "TARIM",
        generateWallet: () => `0x53${crypto.randomBytes(16).toString('hex').slice(0, 4)}...${crypto.randomBytes(2).toString('hex')}`
    },

    security: {
        jwtSecret: env('JWT_SECRET', null),
        jwtExpiresIn: env('JWT_EXPIRES_IN', '7d'),
        // ✅ موحد مع security.js V7.3
        rateLimitGlobal: 150,
        rateLimitLogin: 5,
        helmetEnabled: true,
        bcryptRounds: 12
    },

    aiEye: {
        offline: true,
        model: "TarimAI v7.3 Sovereign ESM",
        language: "ar",
        version: "7.3.0"
    }
};

// ================= تحصين العقل - Deep Freeze V7.3 - ممنوع التعديل نهائياً =================
function deepFreeze(obj) {
    Object.getOwnPropertyNames(obj).forEach(prop => {
        const value = obj[prop];
        if (value && typeof value === 'object' &&!Object.isFrozen(value)) {
            deepFreeze(value);
        }
    });
    return Object.freeze(obj);
}
deepFreeze(settings);

// ================= فحص أمني عند الإقلاع - لا يعمل بدون مفتاح =================
if (!settings.security.jwtSecret) {
    console.error('☠️ [TARIM BRAIN V7.3] JWT_SECRET مفقود - العقل يرفض العمل');
    if (settings.platform.isProduction) {
        process.exit(1);
    } else {
        console.warn('⚠️ [DEV ONLY] استخدام مفتاح مؤقت - ممنوع في الإنتاج');
        settings.security.jwtSecret = 'DEV_ONLY_TEMP_KEY_REPLACE_IN_PROD_' + crypto.randomBytes(32).toString('hex');
    }
}

console.log(`🧠 [TARIM BRAIN V7.3] العقل السيادي محمل - الإصدار ${settings.system.version} - ESM Shield: ${settings.esm.shield}`);

module.exports = settings;
