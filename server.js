const express = require('express');
const helmet = require('helmet');
const path = require('path');
const router = require('./router');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ إصلاح 1: Helmet معدل - يسمح للكاميرا و Leaflet و Tailwind
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ إصلاح 2: ربط مجلد الواجهة
app.use(express.static(path.join(__dirname, 'public')));

// مسارات النظام السيادي API
app.use('/api', router);

// ✅ إصلاح 3: هذا أهم سطر - يخلي كل التبويبات تشتغل حتى لو حدثت الصفحة
// بدونه زر الرجوع والعمليات يعلق
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`👑 TARIM OS Server is running on port ${PORT}`);
    console.log(`🌴 http://localhost:${PORT}`);
});
