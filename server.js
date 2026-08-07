const express = require('express');
const cors = require('cors');
const path = require('path');
const router = require('./router');
const royalSecurity = require('./security');

const app = express();
const PORT = process.env.PORT || 10000;

// تفعيل CORS لربط النطاق السيادي tarimos.org
app.use(cors());

// تفعيل الدرع السيادي الأمني (Helmet + Rate-Limit) مباشرة
royalSecurity(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ربط مجلد الواجهة العامة public
app.use(express.static(path.join(__dirname, 'public')));

// مسارات النظام السيادي API
app.use('/api', router);

// مسار الفحص السريع للحالة السيادية
app.get('/health', (req, res) => {
    res.status(200).json({ status: "OK", system: "TARIM OS Sovereign Server" });
);

// مسار التوجيه الشامل لضمان عمل كافة التبويبات بسلاسة
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// التشغيل على كافة واجهات الشبكة لضمان الاستجابة السريعة على Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`👑 TARIM OS Sovereign Server is running smoothly on port ${PORT}`);
    console.log(`🌴 Powered by Emperor AL - Tarim, Hadhramaut`);
});
