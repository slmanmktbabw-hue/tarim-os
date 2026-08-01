const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

let users = [{ user: 'Gooaz@$&-#', pass: bcrypt.hashSync('KING123', 8), role: 'KING' }];
let posts = [];
let channels = [
  { id: 'general', name: 'عام', icon: '📺', desc: 'القناة العامة', followers: 1250, owner: 'KING' },
  { id: 'quran', name: 'قرآن', icon: '📖', desc: 'تلاوات', followers: 800, owner: 'KING' },
  { id: 'hadramout', name: 'حضرموت', icon: '🏜️', desc: 'أخبار حضرموت', followers: 650, owner: 'KING' },
  { id: 'king', name: 'الملك', icon: '👑', desc: 'قناة الملك السيادية', followers: 5000, owner: 'KING' }
];

app.get('/api/ping', (req,res)=> res.json({ users: users.length, posts: posts.length, channels: channels.length, status: 'KING SECURE V24' }));
app.get('/api/posts', (req,res)=> res.json(posts.reverse()));
app.get('/api/channels', (req,res)=> res.json(channels));
app.get('/api/wallet/:user', (req,res)=> res.json({ balance: 10000 }));
app.post('/api/support', (req,res)=> res.json({ reply: 'تم استلام رسالتك يا ملك 👑 سيتم الرد قريبا' }));

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
  const { user, text, channel } = req.body;
  const newPost = { user, text, channel: channel||'عام', id: Date.now() };
  posts.push(newPost);
  io.emit('broadcast_post', posts);
  res.json({ ok: true });
});

app.post('/api/channels', (req,res)=>{
  const { name, icon, desc, user } = req.body;
  const newCh = { id: Date.now().toString(), name, icon: icon||'📺', desc: desc||'', followers: 0, owner: user };
  channels.push(newCh);
  io.emit('channels_update', channels);
  res.json(newCh);
});

app.post('/api/channels/:id/follow', (req,res)=>{
  const ch = channels.find(c=>c.id===req.params.id || c.name===req.params.id);
  if(ch) ch.followers++;
  io.emit('channels_update', channels);
  res.json({ ok: true });
});

app.get('*', (req,res)=> res.sendFile(path.join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 10000;
server.listen(PORT, ()=> console.log(`TARIM OS V23 KING SECURE on ${PORT}`));
