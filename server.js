const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة البيانات السيادية
const db = new sqlite3.Database('./tarim.db', (err) => {
  if(err) console.error(err);
  console.log('🛡️ Tarim_Core متصلة');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    password TEXT,
    qr TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT,
    receiver TEXT,
    message TEXT,
    time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    user TEXT,
    time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// تسجيل الدخول + انشاء حساب تلقائي
app.post('/api/login', (req, res) => {
  const {phone, password} = req.body;
  if(!phone || !password) return res.json({status:'error', msg:'ناقص'});
  
  db.get("SELECT * FROM users WHERE phone=? AND password=?", [phone, password], (err, user) => {
    if(user){
      db.run("INSERT INTO logs (action,user) VALUES (?,?)", ['login', phone]);
      return res.json({status:'ok', user});
    } else {
      const qrCode = `TARIM-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
      db.run("INSERT INTO users (phone, password, qr) VALUES (?,?,?)", [phone, password, qrCode], function(err){
        if(err) return res.json({status:'error', msg:'المستخدم موجود'});
        const newUser = {id: this.lastID, phone, qr: qrCode};
        db.run("INSERT INTO logs (action,user) VALUES (?,?)", ['register', phone]);
        res.json({status:'ok', user: newUser});
      });
    }
  });
});

app.post('/api/sos', (req, res) => {
  db.run("DELETE FROM users");
  db.run("DELETE FROM messages");
  db.run("DELETE FROM logs");
  io.emit('purge');
  console.log('🚨 تم التطهير السيادي SOS');
  res.json({status:'cleared'});
});

app.post('/api/send', (req, res) => {
  const {sender, receiver, message} = req.body;
  if(!message) return res.json({status:'error'});
  db.run("INSERT INTO messages (sender, receiver, message) VALUES (?,?,?)", [sender||'CEO', receiver||'عام', message]);
  io.emit('chat', {sender: sender||'CEO', message, time: new Date().toLocaleTimeString('ar-SA')});
  res.json({status:'sent'});
});

app.get('/api/messages', (req,res)=>{
  db.all("SELECT * FROM messages ORDER BY id DESC LIMIT 100", (err,rows)=>res.json(rows.reverse()));
});

app.get('/api/logs', (req,res)=>{
  db.all("SELECT * FROM logs ORDER BY id DESC LIMIT 100", (err,rows)=>res.json(rows));
});

// PWA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('👑 CEO متصل:', socket.id);
  socket.on('disconnect', ()=>console.log('CEO خرج'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🏔️ TARIM OS v12.1 شغال على ${PORT}`));
