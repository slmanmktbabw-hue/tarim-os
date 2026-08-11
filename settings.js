// ==============================================================================
// settings.js - TARIM OS V8.7 SECURE - لا أسرار في الكود أبداً
// ==============================================================================
"use strict";
require('dotenv').config();
const crypto = require('crypto');

function env(key, fallback = null) {
    const val = process.env[key];
    return val!== undefined && val!== ''? val : fallback;
}
function envRequired(key) {
    const v = env(key, null);
    if (v === null) throw new Error(`[FATAL] متغير البيئة المطلوب مفقود: ${key}`);
    return v;
}
function envInt(key, fallback) {
    const v = env(key, null);
    if (v === null) return fallback;
    const n = parseInt(v, 10);
    if (isNaN(n)) throw new Error(`[FATAL] ${key} يجب أن يكون رقم`);
    return n;
}

function parseOrigins(raw) {
    const list = raw.split(',').map(s=>s.trim()).filter(Boolean);
    return list.filter(u=>{ try{ new URL(u); return true; } catch{ return false; } });
}

// ===== 1. فحص الأسرار قبل أي شيء - يفشل بسرعة لو ناقص =====
const isProd = env('NODE_ENV','production') === 'production';
const jwtSecret = isProd? envRequired('JWT_SECRET') : env('JWT_SECRET', 'DEV_ONLY_'+crypto.randomBytes(16).toString('hex'));
if (jwtSecret.length < 32) throw new Error('[FATAL] JWT_SECRET قصير جداً - يجب أن يكون 32 حرف على الأقل');

const mongoUri = isProd? envRequired('MONGO_URI') : env('MONGO_URI','mongodb://localhost:27017/souq_al_molouk');
if (isProd && mongoUri.includes('localhost')) throw new Error('[FATAL] لا تستخدم localhost في الإنتاج');

const settings = {
    system: {
        name: "TARIM OS",
        version: "8.7.0 SECURE FINAL",
        build: "2026.08-V8.7",
    },
    location: { city: "Tarim & Taizz", country: "YE", coords: [16.05, 48.9833] },
    platform: {
        port: envInt('PORT', 10000),
        env: env('NODE_ENV','production'),
        domain: parseOrigins(env('CORS_ORIGIN','https://tarimos.org'))[0] || 'https://tarimos.org',
        allDomains: parseOrigins(env('CORS_ORIGIN','https://tarimos.org')),
        isProduction: isProd
    },
    database: { mongoUri, localFile: 'data/tarim-database.json' },
    security: {
        jwtSecret, // تم تعيينه قبل التجميد
        jwtExpiresIn: env('JWT_EXPIRES_IN','7d'),
        rateLimitGlobal: 100,
        rateLimitLogin: 5,
        bcryptRounds: 12
    },
    store: {
        name: 'سوق الملوك - حصن قلعة النور',
        currency: 'YER',
        shipping: 1000,
        freeShippingOver: 20000,
    },
    categories: ['عطور ملكية','ذهب وفضة','بخور ومسك','ملابس ملوك','مخطوطات','سيوف وخناجر','عسل يمني','عام'],
    roles: { KING: 'king', MERCHANT: 'merchant', CUSTOMER: 'customer' },
    orderStatus: { PENDING: 'pending', SEALED: 'sealed', SHIPPED: 'shipped', DELIVERED: 'delivered', CANCELLED: 'cancelled' },
    upload: {
        folder: 'public/uploads',
        maxSize: 2 * 1024 * 1024, // كان 10MB - قللناه لـ 2MB
        allowedTypes: ['image/jpeg','image/png','image/webp'],
        maxFiles: 3
    },
    live: { maxDurationMinutes: 8, autoStop: true },
    okx: {
        initialBalance: 0,
        currency: "USDT",
        wallet: env('OKX_WALLET',''), // لا قيمة افتراضية - يجب أن يأتي من env
    },
    map: { defaultZoom: 13, defaultCenter: [16.05, 48.9833], tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
    // حذفنا defaultKing نهائياً - لا حسابات افتراضية
    messages: {
        unauthorized: 'غير مصرح',
        forbidden: 'ممنوع - للملوك فقط',
        notFound: 'غير موجود',
        serverError: 'خطأ داخلي'
    }
};

function deepFreeze(obj) {
    Object.getOwnPropertyNames(obj).forEach(prop => {
        const v = obj[prop];
        if (v && typeof v === 'object' &&!Object.isFrozen(v)) deepFreeze(v);
    });
    return Object.freeze(obj);
}
deepFreeze(settings);

console.log(`[TARIM V8.7 SECURE] الإعدادات محملة - ${settings.platform.domain}`);

module.exports = { settings };
