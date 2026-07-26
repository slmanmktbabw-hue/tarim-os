const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات SQLite الحقيقية
const db = new sqlite3.Database('./tarim_core.db', (err) => {
    if (err) console.error('خطأ في الاتصال بقاعدة البيانات', err.message);
    else console.log('🛡️ متصل بقاعدة بيانات SQLite السيادية بنجاح.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        phone TEXT,
        balance REAL DEFAULT 0,
        settings TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        time DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// تسجيل دخول أو إنشاء حساب افتراضي
app.post('/api/auth', (req, res) => {
    const { username, phone } = req.body;
    db.run(`INSERT OR IGNORE INTO users (username, phone) VALUES (?, ?)`, [username, phone], function(err) {
        db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
            res.json({ status: 'ok', user: row });
        });
    });
});

// جلب بيانات الملف الشخصي والتحليلات
app.get('/api/user/:id', (req, res) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id], (err, row) => {
        res.json(row || { username: 'CEO', balance: 24300 });
    });
});

// تشغيل السوكت للمراسلة الفورية والبث
io.on('connection', (socket) => {
    console.log('🔗 مستصل متصل بقناة البث والمراسلة الآمنة.');
    socket.on('secure-message', (data) => {
        io.emit('receive-message', data);
    });
});

server.listen(PORT, () => {
    console.log(`🔥 TARIM OS Server running on port ${PORT}`);
});
