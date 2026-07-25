const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const CEO_PASSWORD = process.env.CEO_PASSWORD || 'Tarim2026!Sovereign';

// إنشاء كل الجداول - بما فيها جدول المهام الحقيقي
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS system_logs (
            id SERIAL PRIMARY KEY,
            action VARCHAR(255),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'عالية',
            completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    // إدخال المهام الافتراضية لو الجدول فاضي
    const count = await pool.query('SELECT COUNT(*) FROM tasks');
    if (parseInt(count.rows[0].count) === 0) {
        await pool.query(`INSERT INTO tasks (title, description, status, completed) VALUES
        ('بث مباشر سيادي ومشفر (8 دقائق)', 'سيرفرات أسطورية • إرسال واستقبال هدايا • فلتر بصرية', 'بث نشط', true),
        ('المراسلة والاتصال الآمن بين الحسابات', 'دعم بالذكاء الاصطناعي • حسابات موثقة • إعدادات المستخدم', 'محمي', true),
        ('خريطة حضرموت وتريم بدون نت (Offline)', 'تسجيل صوتي AES • مشاركة سيادية تهدم خلال 5 دقائق', 'ميداني', true),
        ('إصدار الختم الميداني المشفر + QR', 'توليد 10 منشورات ورجع التشفيل • عين الذكاء الاصطناعي Tesseract', 'راجع API', false)
        `);
    }
    console.log("[+] TARIM OS v9.0 REAL Tasks DB Initialized.");
}
initDB();

// API المهام الحقيقية
app.get('/api/tasks', async (req, res) => {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(result.rows);
});
app.post('/api/tasks', async (req, res) => {
    const { title } = req.body;
    const result = await pool.query('INSERT INTO tasks (title) VALUES ($1) RETURNING *', [title]);
    io.emit('tasks_update');
    res.json(result.rows[0]);
});
app.put('/api/tasks/:id', async (req, res) => {
    const { completed } = req.body;
    const result = await pool.query('UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *', [completed, req.params.id]);
    io.emit('tasks_update');
    res.json(result.rows[0]);
});

app.get('/api/status', async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: "ONLINE & SECURE", sovereign: "TARIM OS v9.0 REAL", db_time: result.rows[0].now });
});

app.post('/api/verify-ceo', (req, res) => {
    if (req.body.password === CEO_PASSWORD) res.json({ success: true });
    else res.status(401).json({ error: "كلمة السر السيادية غير صحيحة!" });
});

app.post('/api/register', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        const newUser = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email', [req.body.username, req.body.email, hash]);
        res.json({ message: "تم إنشاء الحساب السيادي!", user: newUser.rows[0] });
    } catch (err) {
        res.status(400).json({ error: "البريد أو الاسم مستخدم مسبقاً." });
    }
});

// HTML مع ربط حقيقي
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TARIM OS v9.0 REAL</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<script src="/socket.io/socket.io.js"></script>
<style>body{background:#0b0f19;color:#fff}.glass-card{background:rgba(17,24,39,0.85);backdrop-filter:blur(15px);border:1px solid rgba(0,243,255,0.2)}</style>
</head>
<body class="pb-28">
<header class="flex justify-between items-center px-4 py-3 glass-card"><span class="font-bold text-cyan-400">TARIM OS v9.0 REAL</span><span class="text-xs text-green-400">● متصل بقاعدة حقيقية</span></header>
<main class="p-4"><div id="tasksContainer" class="space-y-3">جاري تحميل المهام من PostgreSQL...</div></main>
<script>
const socket = io();
async function loadTasks(){
    const res = await fetch('/api/tasks');
    const tasks = await res.json();
    document.getElementById('tasksContainer').innerHTML = tasks.map(t => \`
        <div class="glass-card p-4 rounded-2xl border-l-4 \${t.completed?'border-cyan-500':'border-yellow-500'} flex justify-between items-center">
            <div class="flex items-center gap-3"><input type="checkbox" \${t.completed?'checked':''} onchange="toggleTask(\${t.id}, this.checked)" class="w-5 h-5">
            <div><h3 class="font-bold text-sm">\${t.title}</h3><p class="text-xs text-gray-400">\${t.description||''}</p></div></div>
            <span class="text-xs px-2 py-1 rounded-full bg-gray-800">\${t.status}</span>
        </div>\`).join('');
}
async function toggleTask(id, completed){
    await fetch('/api/tasks/'+id, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({completed})});
}
socket.on('tasks_update', loadTasks);
loadTasks();
</script></body></html>`;

app.get('/', (req, res) => res.send(HTML_TEMPLATE));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`[+] TARIM OS v9.0 REAL running on ${PORT}`));
