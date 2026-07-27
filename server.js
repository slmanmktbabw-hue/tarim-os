const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// قراءة كافة الملفات من المجلد الرئيسي مباشرة
app.use(express.static(__dirname));

// توجيه الصفحة الرئيسية لملف الواجهة
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Tarim-OS Server is running on port ${PORT}`);
});
