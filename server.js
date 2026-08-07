const express = require('express');
const helmet = require('helmet');
const path = require('path');
const router = require('./router');

const app = express();
const PORT = process.env.PORT || 3000;

// تفعيل حماية Helmet السيادية
app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ربط مجلد الواجهة العامة public
app.use(express.static(path.join(__dirname, 'public')));

// مسارات النظام السيادي
app.use('/api', router);

app.listen(PORT, () => {
    console.log(`👑 TARIM OS Server is running on port ${PORT}`);
});
