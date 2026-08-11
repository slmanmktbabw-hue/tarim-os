# TARIM OS V7.4 - Imperial Sovereign OS - FINAL SEAL GOLD 🐉👑🛡️

> أول نظام تشغيل إمبراطوري حضرمي سيادي - Offline First + سيادة كاملة - من تريم إلى العالم.

![Sovereign Shield](https://img.shields.io/badge/Shield-Sovereign%20V7.4%20HARDENED-0a0a0a?style=for-the-badge&logo=shield)
![Security](https://img.shields.io/badge/Security-Hardened%20Headers%20%7C%20SRI%20%7C%20CSP-success?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square)
![Offline](https://img.shields.io/badge/Offline-Ready-2E7D32?style=flat-square)

**Live:** [tarimos.org](https://tarimos.org) | **Status:** `Production Hardened` | **License:** `Sovereign`

---

### 🏰 المميزات السيادية

نظام سيادي متكامل يعمل بمبدأ **Offline First** مع 5 أركان رئيسية: الواجهة الرئيسية، العمليات الميدانية، محطة الإنشاء، مركز الوارد، والملف السيادي.

- **أداء عالي:** واجهة خفيفة وسريعة مبنية بـ Vanilla JS
- **يعمل بدون إنترنت:** خريطة حضرموت Offline + PWA Cache
- **بث ومراسلة آمنة:** اتصال مشفر بالكامل

### ⚙️ التقنيات المحصنة V7.4

#### الواجهة الأمامية:
* **Architecture:** Vanilla JS + HTML5 + CSS3 - PWA Ready
* **Security First:** تحميل الموارد الخارجية عبر ESM مع تفعيل Subresource Integrity (SRI) و Content Security Policy (CSP)
* **Offline:** Service Worker مع استراتيجية Cache-First الآمنة

#### الخلفية (Backend):
* **Stack:** Node.js + Express.js (LTS)
* **Security Headers:** Helmet + HSTS + CSP + Strict CORS
* **Protection:** Rate-Limiting + JWT Short-Lived + Secure Cookies (HttpOnly, Secure, SameSite=Strict)
* **Database:** PostgreSQL مع تشفير SSL/TLS (verify-full) في الإنتاج

---

### 🚀 التشغيل الآمن

> **تنبيه أمني:** لا تقم أبداً برفع ملف `.env` الحقيقي. استخدم القالب فقط.

1. **التهيئة:**
   ```bash
   git clone https://github.com/slmanmkt/tarim-os.git
   cd tarim-os
   cp .env.example .env
   # قم بتعبئة المفاتيح العشوائية: openssl rand -base64 64
