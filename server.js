const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

process.on('unhandledRejection', (err) => {
  console.log('⚠️ Ignored:', err.message);
});

const CEO_PASSWORD = process.env.CEO_PASSWORD || 'Tarim2026!Sovereign';

let pool = null;
let memoryTasks = [
  { id: 1, title: 'بث مباشر سيادي ومشفر (8 دقائق)', description: 'سيرفرات أسطورية • إرسال واستقبال هدايا • فلتر بصرية', status: 'بث نشط', completed: true },
  { id: 2, title: 'المراسلة والاتصال الآمن بين الحسابات', description: 'دعم بالذكاء الاصطناعي • حسابات موثقة • إعدادات المستخدم', status: 'محمي', completed: true },
  { id: 3, title: 'خريطة حضرموت وتريم بدون نت (Offline)', description: 'تسجيل صوتي AES • مشاركة سيادية تهدم خلال 5 دقائق', status: 'ميداني', completed: true },
  { id: 4, title: 'إصدار الختم الميداني المشفر + QR', description: 'توليد 10 منشورات ورجع التشفيل • عين الذكاء الاصطناعي Tesseract', status: 'راجع API', completed: false }
];

async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ MEMORY mode - No DB needed');
    return;
  }
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await pool.query('SELECT 1');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, email VARCHAR(150) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS system_logs (id SERIAL PRIMARY KEY, action VARCHAR(255), timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(20) DEFAULT 'عالية', completed BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    `);
    const count = await pool.query('SELECT COUNT(*) FROM tasks');
    if (parseInt(count.rows[0].count) === 0) {
        await pool.query(`INSERT INTO tasks (title, description, status, completed) VALUES ('بث مباشر سيادي ومشفر (8 دقائق)', 'سيرفرات أسطورية • إرسال واستقبال هدايا • فلتر بصرية', 'بث نشط', true), ('المراسلة والاتصال الآمن بين الحسابات', 'دعم بالذكاء الاصطناعي • حسابات موثقة • إعدادات المستخدم', 'محمي', true), ('خريطة حضرموت وتريم بدون نت (Offline)', 'تسجيل صوتي AES • مشاركة سيادية تهدم خلال 5 دقائق', 'ميداني', true), ('إصدار الختم الميداني المشفر + QR', 'توليد 10 منشورات ورجع التشفيل • عين الذكاء الاصطناعي Tesseract', 'راجع API', false)`);
    }
    console.log("[+] DB Connected - PostgreSQL");
  } catch (e) {
    console.log('⚠️ DB failed, MEMORY mode:', e.message);
    pool = null;
  }
}
initDB();

app.get('/api/tasks', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
      return res.json(result.rows);
    } else {
      return res.json(memoryTasks);
    }
  } catch (e) { return res.json(memoryTasks); }
});

app.post('/api/tasks', async (req, res) => {
  if (pool) {
    const result = await pool.query('INSERT INTO tasks (title) VALUES ($1) RETURNING *', [req.body.title]);
    io.emit('tasks_update');
    return res.json(result.rows[0]);
  } else {
    const newTask = { id: Date.now(), title: req.body.title, description: '', status: 'جديد', completed: false };
    memoryTasks.push(newTask);
    io.emit('tasks_update');
    return res.json(newTask);
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  if (pool) {
    const result = await pool.query('UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *', [req.body.completed, req.params.id]);
    io.emit('tasks_update');
    return res.json(result.rows[0]);
  } else {
    const task = memoryTasks.find(t => t.id == req.params.id);
    if (task) task.completed = req.body.completed;
    io.emit('tasks_update');
    return res.json(task);
  }
});

app.get('/api/status', async (req, res) => {
  if (pool) {
    try {
      const result = await pool.query('SELECT NOW()');
      return res.json({ status: "ONLINE & SECURE", sovereign: "TARIM OS v9.0 REAL", db_mode: "PostgreSQL", db_time: result.rows[0].now });
    } catch {}
  }
  res.json({ status: "ONLINE & SECURE", sovereign: "TARIM OS v9.0 REAL", db_mode: "MEMORY" });
});

app.post('/api/verify-ceo', (req, res) => {
    if (req.body.password === CEO_PASSWORD) res.json({ success: true });
    else res.status(401).json({ error: "كلمة السر السيادية غير صحيحة!" });
});

app.post('/api/register', async (req, res) => {
    try {
        if (!pool) return res.json({ message: "تم إنشاء الحساب السيادي (وضع الذاكرة)!", user: { id: 1, username: req.body.username, email: req.body.email } });
        const hash = await bcrypt.hash(req.body.password, 10);
        const newUser = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email', [req.body.username, req.body.email, hash]);
        res.json({ message: "تم إنشاء الحساب السيادي!", user: newUser.rows[0] });
    } catch (err) {
        res.status(400).json({ error: "البريد أو الاسم مستخدم مسبقاً." });
    }
});

// هذا السطر هو اللي يشغل الأزرار والموقع الأصلي!
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`[+] TARIM OS v9.0 REAL running on ${PORT}`));
