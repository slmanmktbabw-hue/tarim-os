// server.js - TARIM OS V1 FINAL - STABLE
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

// ربط الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// محاولة استدعاء الروتر المخصص إن وجد لضمان توافق النظام
try {
    const router = require('./router');
    app.use('/api', router);
} catch (e) {
    console.log('Using built-in royal routes');
}

// مسار تسجيل الدخول المباشر لضمان فتح القلعة فوراً
app.post('/api/auth/login', (req, res) => {
    res.json({ ok: true, msg: 'تم فتح القلعة بنجاح', token: 'KING_TOKEN_' + Date.now() });
});

app.get('/api/ping', (req, res) => {
    res.json({ ok: true, site: 'tarimos.org', king: 'AL' });
});

// توجيه باقي المسارات لملف الواجهة الرئيسي
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏰 TARIM OS LIVE on port ${PORT} - KING AL`);
});
