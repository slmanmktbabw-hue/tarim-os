const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

// تقديم مجلد public بالكامل كواجهة رسمية للتطبيق
app.use(express.static(path.join(__dirname, 'public')));

// مسار التحقق السيادي للـ CEO
app.post('/api/verify-ceo', (req, res) => {
    const { password } = req.body;
    if (password === "2026" || password === "1234" || password === "Tarim2026!Sovereign") {
        res.json({ success: true, message: "تم التحقق بنجاح من صلاحيات الملك والـ CEO." });
    } else {
        res.status(401).json({ error: "رمز الحماية غير صحيح!" });
    }
});

// توجيه جميع الطلبات الأخرى إلى index.html لتعمل التبويبات بسلاسة
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[+] TARIM OS Sovereign Server running on port ${PORT}`);
});
