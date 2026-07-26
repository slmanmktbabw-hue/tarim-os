const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let tasks = [];

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const task = { id: Date.now(), ...req.body, createdAt: new Date() };
  tasks.unshift(task);
  io.emit('newTask', task);
  res.json(task);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('CEO متصل:', socket.id);
  socket.on('message', (data) => {
    io.emit('message', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`TARIM OS v13.6 شغال على http://localhost:${PORT}`);
});
