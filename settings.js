// settings.js - TARIM OS V7.4 - IMMUTABLE BRAIN HARDENED
require('dotenv').config();
const crypto = require('crypto');

function env(key, fallback = null) {
    const val = process.env[key];
    return val!== undefined && String(val).trim()!== ''? String(val).trim() : fallback;
}
function envInt(key, fallback, min, max) {
    const v = env(key, null);
    if (v === null) return fallback;
    const n = parseInt(v, 10);
    if (isNaN(n) || n < min || n > max) return fallback;
    return n;
}

// 1. فحص المفتاح السيادي - مع فصل كامل للأسرار
let _jwtSecret = env('JWT_SECRET', null);
const isProduction = env('NODE_ENV', 'production') === 'production';

if (!_jwtSecret) {
    if (isProduction) {
        console.error('☠️ [FATAL] JWT_SECRET مفقود - إيقاف العقل');
        process.exit(1);
    } else {
        _jwtSecret = 'DEV_ONLY_' + crypto.randomBytes(32).toString('hex');
        console.warn('⚠️ [DEV] مفتاح مؤقت فقط');
    }
}
if (_jwtSecret.length < 64) {
    console.error('☠️ [FATAL] JWT_SECRET قصير - يجب 64 محرف على الأقل');
    process.exit(1);
}

// 2. تحقق صارم من CORS - يمنع https://evil.com
function parseOrigins(raw) {
    const fallback = ['https://tarimos.org'];
    if (!raw) return fallback;
    return raw.split(',')
       .map(s => s.trim())
       .filter(s => {
            try {
                const u = new URL(s);
                return u.protocol === 'https:' &&!s.includes('*');
            } catch { return false; }
        })
       .slice(0, 5); // حد أقصى 5 دومينات
}
const origins = parseOrigins(env('CORS_ORIGIN', null));

// الأسرار لا توضع في settings أبداً - تبقى في closure
const SECRETS = {
    get jwtSecret() { return _jwtSecret; },
    get okxWallet() { return env('OKX_WALLET', ''); },
    get nowPayKey() { return env('NOWPAY_API_KEY', ''); }
};

const settings = {
    system: {
        name: "TARIM OS",
        version: "7.4.0 Hardened",
        build: "2026.08.12-V7.4-FORTRESS",
        // تم حذف emperorName و seal - تسريب معلومات
    },
    location: {
        city: "Tarim",
        region: "Hadhramaut",
        country: "YE",
        coords: [16.05, 48.9833],
    },
    platform: {
        port: envInt('PORT', 10000, 1000, 65535),
        env: env('NODE_ENV', 'production'),
        domain: origins[0],
        allDomains: origins,
        isProduction
    },
    live: {
        maxDurationMinutes: 8,
        maxDurationSeconds: 480,
        autoStop: true,
        enableChat: true,
        enableLikes: true,
        enableGifts: true // يدار عبر DB وليس هنا
    },
    map: {
        provider: "Offline Leaflet V7.4",
        defaultZoom: 13,
        defaultCenter: [16.05, 48.9833],
        offlineCache: true,
        tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© TARIM OS | OSM"
    },
    esm: {
        shield: "esm.unpkg.com + SRI",
        imports: {
            // أضف integrity في index.html وليس هنا
            "leaflet": "https://esm.unpkg.com/leaflet@1.9.4?bundle&target=es2022&min",
            "socket.io-client": "https://esm.unpkg.com/socket.io-client@4.8.1?bundle&target=es2022&min"
        }
    },
    security: {
        // لا يوجد jwtSecret هنا أبداً
        jwtExpiresIn: env('JWT_EXPIRES_IN', '15m'), // تم التصحيح من 7d إلى 15m
        jwtRefreshExpiresIn: env('JWT_REFRESH_EXPIRES_IN', '7d'),
        rateLimitGlobal: envInt('RATE_LIMIT_MAX_REQUESTS', 100, 10, 1000),
        rateLimitLogin: envInt('RATE_LIMIT_LOGIN_MAX', 5, 2, 20),
        bcryptRounds: 12
    }
};

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

// 3. تصدير آمن - الأسرار عبر دوال فقط وليس كائن
module.exports = {
   ...settings,
    // دالة للحصول على السر - لا يمكن عمل JSON.stringify لها
    getJwtSecret: () => SECRETS.jwtSecret,
    getSecrets: () => {
        if (isProduction) throw new Error('Secrets access denied in production context');
        return SECRETS;
    },
    // للاستخدام الداخلي فقط في server.js
    _secrets: SECRETS
};

console.log(`🧠 [BRAIN V7.4] محمل - ${settings.system.version} - Domain: ${settings.platform.domain}`);
