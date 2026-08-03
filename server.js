const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username && password) res.json({ success: true, user: { username } });
    else res.json({ success: false });
});

io.on('connection', (socket) => {
    socket.on('startLive', () => socket.emit('liveStarted', { roomId: socket.id }));
    socket.on('stopLive', () => {});
});

process.on('uncaughtException', err => console.log(err)); // يمنع الطيح

server.listen(PORT, () => console.log(`🚀 شغال على ${PORT}`));
