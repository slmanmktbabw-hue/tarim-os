const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./tarim_core.db', (err) => {
    if (err) console.error('خطأ في قاعدة البيانات:', err.message);
    else console.log('🛡️ قاعدة بيانات SQLite متصلة بنجاح.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identity TEXT UNIQUE,
        password_hash TEXT,
        login_type TEXT,
        balance REAL DEFAULT 24300,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

app.post('/api/auth/register', async (req, res) => {
    const { identity, password, login_type } = req.body;
    if(!identity) return res.status(400).json({ error: 'الرجاء إدخال البريد أو الجوال' });
    
    const hash = password ? await bcrypt.hash(password, 10) : 'oauth_google';
    
    db.run(`INSERT OR IGNORE INTO users (identity, password_hash, login_type) VALUES (?, ?, ?)`, 
    [identity, hash, login_type || 'phone'], function(err) {
        db.get(`SELECT * FROM users WHERE identity = ?`, [identity], (err, user) => {
            if(err) return res.status(500).json({ error: 'خطأ في الخادم' });
            res.json({ status: 'ok', user });
        });
    });
});

io.on('connection', (socket) => {
    socket.on('send-message', (data) => {
        io.emit('receive-message', data);
    });
});

server.listen(PORT, () => {
    console.log(`🔥 TARIM OS Production Server running on port ${PORT}`);
});
