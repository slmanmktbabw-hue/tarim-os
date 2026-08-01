const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = [{ user: 'Gooaz@$&-#', pass: bcrypt.hashSync('KING123', 8), role: 'KING' }];
let posts = [];
let channels = [];

app.get('/api/ping', (req,res)=> res.json({ users: users.length, posts: posts.length }));
app.get('/api/posts', (req,res)=> res.json(posts));
app.get('/api/channels', (req,res)=> res.json(channels));
app.get('/api/wallet/:user', (req,res)=> res.json({ balance: 10000 }));
app.post('/api/support', (req,res)=> res.json({ reply: 'تم الاستلام يا ملك 👑' }));

app.post('/api/auth/register', (req,res)=>{
  const { user, pass } = req.body;
  if(users.find(u=>u.user===user)) return res.json({ error: 'المستخدم موجود' });
  const role = user.includes('Gooaz') ? 'KING' : 'user';
  users.push({ user, pass: bcrypt.hashSync(pass,8), role });
  res.json({ user, role, token: 'KING-TOKEN-'+Date.now() });
});

app.post('/api/auth/login', (req,res)=>{
  const { user, pass } = req.body;
  const found = users.find(u=>u.user===user);
  if(!found) return res.json({ error: 'المستخدم غير موجود' });
  if(!bcrypt.compareSync(pass, found.pass)) return res.json({ error: 'كلمة المرور خطأ' });
  res.json({ user: found.user, role: found.role, token: 'KING-TOKEN-'+Date.now() });
});

app.post('/api/posts', (req,res)=>{
  posts.push({ user: req.body.user, text: req.body.text, id: Date.now() });
  io.emit('broadcast_post', posts);
  res.json({ ok: true });
});

app.get('*', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 10000;
server.listen(PORT, ()=> console.log(`TARIM OS V24 KING SECURE on ${PORT}`));
