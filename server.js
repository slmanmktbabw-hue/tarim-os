const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// توجيه الصفحة الرئيسية مباشرة إلى index.html الجديد
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// استقبال المنشورات السيادية الحقيقية
let postsList = [];
app.post('/api/posts', (req, res) => {
  const { title, content, user } = req.body;
  const newPost = { title, content, user, date: new Date() };
  postsList.unshift(newPost);
  res.json({ ok: true, post: newPost });
});

app.get('/api/posts', (req, res) => {
  res.json(postsList);
});

// أمر النظام الذكي السيادي
app.post('/api/system/execute', (req, res) => {
  const { command, user } = req.body;
  res.json({ success: true, output: `تم تنفيذ الأمر السيادي (${command}) بنجاح بواسطة الإمبراطور ${user}` });
});

io.on('connection', (socket) => {
  socket.on('message', (data) => {
    io.emit('message', data);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`TARIM OS Server running on port ${PORT}`);
});
