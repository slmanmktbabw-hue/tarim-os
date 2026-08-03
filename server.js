const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات وهمية مؤقتة للملفات والدخول لتجنب أي أخطاء
let users = {};

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: 'ادخل البيانات كاملة' });
  users[username] = { username, password, okki_balance: 100, followers: 10, likes: 120, posts: 2 };
  res.json({ success: true, user: users[username] });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    res.json({ success: true, user: users[username] });
  } else {
    res.json({ success: false, message: 'بيانات الدخول غير صحيحة' });
  }
});

app.post('/api/qr', (req, res) => {
  const { phone } = req.body;
  res.json({ success: true, qr: `TARIM-OS-SECURE-${phone || 'Gooaz'}` });
});

io.on('connection', (socket) => {
  socket.on('registerSocket', (username) => {
    socket.join(username);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 TARIM OS يعمل باستقرار تام على البورت: ${PORT}`);
});
