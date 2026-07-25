const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

process.on('unhandledRejection', (err) => console.log('⚠️', err.message));

const CEO_PASSWORD = process.env.CEO_PASSWORD || 'Tarim2026!Sovereign';
let pool = null;
let memoryTasks = [
  { id: 1, title: 'بث مباشر سيادي ومشفر (8 دقائق)', description: 'سيرفرات أسطورية • إرسال واستقبال هدايا • فلتر بصرية', status: 'بث نشط', completed: true },
  { id: 2, title: 'المراسلة والاتصال الآمن بين الحسابات', description: 'دعم بالذكاء الاصطناعي • حسابات موثقة', status: 'محمي', completed: true },
  { id: 3, title: 'خريطة حضرموت وتريم بدون نت (Offline)', description: 'تسجيل صوتي AES • مشاركة سيادية', status: 'ميداني', completed: true },
  { id: 4, title: 'إصدار الختم الميداني المشفر + QR', description: 'Tesseract', status: 'راجع API', completed: false }
];

async function initDB() {
  if (!process.env.DATABASE_URL) { console.log('MEMORY mode'); return; }
  try {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await pool.query('SELECT 1');
    console.log('DB Connected');
  } catch (e) { pool = null; console.log('MEMORY fallback:', e.message); }
}
initDB();

app.get('/api/tasks', async (req, res) => {
  if (pool) { try { const r = await pool.query('SELECT * FROM tasks ORDER BY id ASC'); return res.json(r.rows); } catch {} }
  res.json(memoryTasks);
});
app.post('/api/tasks', (req, res) => {
  const t = { id: Date.now(), title: req.body.title, status: 'جديد', completed: false };
  memoryTasks.push(t); io.emit('tasks_update'); res.json(t);
});
app.put('/api/tasks/:id', (req, res) => {
  const t = memoryTasks.find(x => x.id == req.params.id); if(t) t.completed = req.body.completed;
  io.emit('tasks_update'); res.json(t);
});
app.get('/api/status', (req, res) => res.json({ status: "ONLINE", mode: pool ? "DB" : "MEMORY" }));
app.post('/api/verify-ceo', (req, res) => {
  if (req.body.password === CEO_PASSWORD) res.json({ success: true });
  else res.status(401).json({ error: "خطأ!" });
});

const HTML_TEMPLATE = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>TARIM OS v9.0</title><script src="https://cdn.tailwindcss.com"></script><script src="/socket.io/socket.io.js"></script><style>body{background:#0b0f19;color:#fff}.glass{background:rgba(17,24,39,0.85);border:1px solid rgba(0,243,255,0.2)}</style></head><body class="p-4"><header class="flex justify-between glass p-3 rounded-xl"><b class="text-cyan-400">TARIM OS v9.0 REAL</b><span class="text-green-400 text-xs">● LIVE</span></header><div id="tasks" class="space-y-3 mt-4"></div><div class="fixed bottom-0 left-0 right-0 glass p-3 flex justify-around"><button onclick="location.reload()">🔄</button><button onclick="alert('البث قادم')">📺 البث</button><button onclick="alert('المهام')">☰ المهام</button><button onclick="alert('الذكاء')">➕</button><button onclick="alert('المحادثات')">💬</button><button onclick="alert('الملف')">👤</button></div><script>
const socket=io(); async function load(){ const r=await fetch('/api/tasks'); const tasks=await r.json(); document.getElementById('tasks').innerHTML=tasks.map(t=>\`<div class="glass p-4 rounded-xl flex justify-between"><div><h3>\${t.title}</h3><p class="text-xs text-gray-400">\${t.description||''}</p></div><input type="checkbox" \${t.completed?'checked':''} onchange="toggle(\${t.id},this.checked)"></div>\`).join(''); } async function toggle(id,c){ await fetch('/api/tasks/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({completed:c})}); } socket.on('tasks_update',load); load();<\/script></body></html>`;

app.get('/', (req, res) => {
  const indexFile = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  } else {
    return res.send(HTML_TEMPLATE);
  }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Running on '+PORT));
