const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
// هذا هو السطر المهم - يقرا من مجلد عام اللي عندك
app.use(express.static(path.join(__dirname, 'عام')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL? { rejectUnauthorized: false } : false
});

async function initDB(){
  try{
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20),
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS seals (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        title TEXT,
        issued_by TEXT DEFAULT 'الإمبراطور AL',
        issued_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const count = await pool.query('SELECT COUNT(*) FROM tasks');
    if(parseInt(count.rows[0].count)===0){
      await pool.query(`INSERT INTO tasks (title, description, status, completed) VALUES
        ('بث مباشر سيادي ومشفر (8 دقائق)', 'سيرفرات أسطورية • إرسال واستقبال هدايا • فلتر بصري', 'بث نشط', true),
        ('المراسلة والاتصال الآمن بين الحسابات', 'دعم بالذكاء الاصطناعي • حسابات موثقة', 'محمي', true),
        ('خريطة حضرموت وتريم بدون نت (Offline)', 'تسجيل صوتي AES • مشاركة سيادية', 'ميداني', true),
        ('إصدار الختم الميداني المشفر + QR', 'عين الذكاء Tesseract • توثيق رسمي', 'جاهز', false)
      `);
    }
    console.log("[+] TARIM OS v13.0 DB Connected");
  }catch(e){
    console.log("[!] DB error:", e.message);
  }
}
initDB();

app.get('/api/tasks', async (req,res)=>{
  try{
    const r = await pool.query('SELECT * FROM tasks ORDER BY id');
    res.json(r.rows);
  }catch(e){ res.json([]); }
});

app.put('/api/tasks/:id', async (req,res)=>{
  try{
    const {completed} = req.body;
    const r = await pool.query('UPDATE tasks SET completed=$1 WHERE id=$2 RETURNING *', [completed, req.params.id]);
    io.emit('tasks_update');
    res.json(r.rows[0]);
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/seals', async (req,res)=>{
  try{
    const code = 'TARIM-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).substring(2,5).toUpperCase();
    const title = req.body.title||'وثيقة سيادية';
    await pool.query('INSERT INTO seals (code,title) VALUES ($1,$2)', [code,title]);
    await pool.query("UPDATE tasks SET completed=true WHERE title LIKE '%الختم الميداني%'");
    io.emit('tasks_update');
    res.json({code, url: `https://tarim-os.onrender.com/verify/${code}`});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/verify/:code', async (req,res)=>{
  try{
    const r = await pool.query('SELECT * FROM seals WHERE code=$1', [req.params.code]);
    if(r.rows.length===0) return res.send('<h1 style="text-align:center;padding:50px;background:#000;color:red">❌ ختم مزور</h1>');
    res.send(`<div style="background:#06080e;color:#00E5FF;text-align:center;padding:40px;font-family:Tajawal"><h1>✅ ختم سيادي موثق</h1><p>الكود: ${r.rows[0].code}</p><p>صادر من: ${r.rows[0].issued_by}</p><p>${new Date(r.rows[0].issued_at).toLocaleString('ar-SA')}</p></div>`);
  }catch(e){ res.send('خطأ'); }
});

app.post('/api/auth', (req,res)=>{
  if(req.body.pin==='2026'||req.body.pin==='AL2026') return res.json({success:true});
  res.status(401).json({success:false});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('TARIM OS V13 running on '+PORT));
