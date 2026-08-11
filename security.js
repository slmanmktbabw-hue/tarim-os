// ==============================================================================
// security.js - TARIM OS V8.7 SECURE SHIELD - لا ثغرات
// ==============================================================================
"use strict";
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. فحص قاتل - السيرفر لا يعمل بدون مفتاح
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('[FATAL] JWT_SECRET مفقود أو قصير جداً - يجب 32 حرف على الأقل');
}

// 2. Rate Limiters - بدون استثناءات
const sovereignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, msg: 'طلبات كثيرة - انتظر 15 دقيقة' },
  keyGenerator: (req) => req.ip + '-' + (req.user?.id || 'guest')
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 80,
  message: { success: false, msg: 'تهدئة - طلبات كثيرة' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, msg: 'البوابة مقفلة 15 دقيقة - محاولات كثيرة' }
});

// 3. Helmet V8.7 - بدون blob وبدون unsafe-inline للسكربت
const helmetShield = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://unpkg.com", "https://esm.unpkg.com", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "wss:", "https://esm.unpkg.com", "https://*.tile.openstreetmap.org"],
      workerSrc: ["'self'"], // حذف blob:
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true }
});

function secureHeaders(req,res,next){
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(self), microphone=(self), geolocation=(self)');
  next();
}

// 4. التوكن - بدون fallback
function createToken(payload){
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}
function verifyToken(token){
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
}
async function hashPassword(p){ return bcrypt.hash(p, 12); }
async function checkPassword(p,h){ return bcrypt.compare(p,h); }

function isStrongPassword(pass){
  if (!pass || typeof pass!== 'string') return false;
  if (pass.length < 8) return false;
  // حرف كبير + صغير + رقم
  return /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass);
}

// 5. تطهير قوي ضد NoSQL Injection
function sanitizeInput(obj){
  if (!obj || typeof obj!== 'object') return obj;
  const clean = Array.isArray(obj)? [] : {};
  for (let k in obj){
    const v = obj[k];
    if (k.startsWith('$') || k.includes('.')) continue; // منع $gt
    if (typeof v === 'string') clean[k] = v.replace(/\$/g,'').trim().slice(0,500);
    else if (typeof v === 'object') clean[k] = sanitizeInput(v);
    else if (typeof v === 'number' || typeof v === 'boolean') clean[k] = v;
  }
  return clean;
}
function sanitizeMiddleware(req,res,next){
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  next();
}

// 6. حراس
function auth(req,res,next){
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ success:false, msg:'غير مصرح' });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success:false, msg:'توكن منتهي' });
  req.user = decoded;
  next();
}
function isKing(req,res,next){
  if (req.user?.role!== 'king') return res.status(403).json({ success:false, msg:'للملوك فقط' });
  next();
}
function allowRoles(...roles){
  return (req,res,next)=>{
    if (!roles.includes(req.user?.role)) return res.status(403).json({ success:false, msg:'ممنوع' });
    next();
  };
}

function setup(app){
  app.use(helmetShield);
  app.use(secureHeaders);
  app.use(sanitizeMiddleware);
  app.use('/api/', sovereignLimiter);
  app.use('/api/', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  console.log('🛡️ V8.7 SECURE SHIELD Active');
}
setup.auth = auth;
setup.isKing = isKing;

module.exports = setup;
module.exports.createToken = createToken;
module.exports.verifyToken = verifyToken;
module.exports.hashPassword = hashPassword;
module.exports.checkPassword = checkPassword;
module.exports.protect = auth;
module.exports.allowRoles = allowRoles;
module.exports.isKing = isKing;
module.exports.auth = auth;
module.exports.loginLimiter = authLimiter;
module.exports.apiLimiter = apiLimiter;
module.exports.sanitizeMiddleware = sanitizeMiddleware;
module.exports.isStrongPassword = isStrongPassword;
module.exports.setup = setup;
