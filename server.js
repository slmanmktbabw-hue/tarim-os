const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(cors());

// هذا السطر هو اللي يخلي public يشتغل
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL? { rejectUnauthorized: false } : false
});

// انشاء الجداول
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
        issued_by TEXT DEFAULT 'الامبراطور AL',
        issued_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const count = await pool.query('SELECT COUNT(*) FROM tasks');
    if(parseInt(count.rows[0].count) === 0){
      await pool.query(`
        INSERT INTO tasks (title, description, status, completed) VALUES
        ('بث مباشر سيادي ومشفر (8 دقائق)', 'سيرفرات اسطورية • هدايا', 'بث نشط', true),
        ('المراسلة والاتصال الامن بين الحسابات', 'دعم بالذكاء الاصطناعي', 'محمي', true),
        ('خريطة حضرموت وتريم بدون نت (Offline)', 'تسجيل صوتي AES', 'ميداني', true),
        ('اصدار الختم الميداني المشفر + QR', 'عين الذكاء Tesseract', 'جاهز', false)
      `);
      console.log("[+] تم زرع المهام الاربع");
    }
    console.log("[+] TARIM OS v13.1 DB Ready");
  }catch(e){
    console.log("DB Error:", e.message);
  }
}
initDB();

// API
app.get('/api/tasks', async (req,res)=>{
  try{
    const r = await pool.query('SELECT * FROM tasks ORDER BY id');
    res.json(r.rows);
  }catch(e){ res.json([]); }
});

app.put('/api/tasks/:id', async (req,res)=>{
  try{
    const { completed } = req.body;
    const r = await pool.query('UPDATE tasks SET completed=$1 WHERE id=$2 RETURNING *', [completed, req.params.id]);
    io.emit('tasks_update');
    res.json(r.rows[0]);
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/seals', async (req,res)=>{
  try{
    const code = 'TARIM-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).substring(2,5).toUpperCase();
    const title = req.body.title || 'وثيقة سيادية';
    await pool.query('INSERT INTO seals (code,title) VALUES ($1,$2)', [code, title]);
    await pool.query("UPDATE tasks SET completed=true WHERE title LIKE '%الختم%'");
    io.emit('tasks_update');
    res.json({code, url: `/verify/${code}`});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/status', (req,res)=>{
  res.json({status:'ACTIVE', version:'13.1', db:!!process.env.DATABASE_URL});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('TARIM OS V13.1 on '+PORT));
