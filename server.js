const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// محفظة الملك OKX
const KING_OKX_WALLET = '0x53ce5e429ac48f355b775e418ded0b13931c0af6';

app.get('/api/wallet', (req, res) => {
  res.json({ status: 'active', wallet: KING_OKX_WALLET, system: 'TARIM OS v15.0' });
});

// مهم جداً لحل Not Found - يرجع index.html لأي مسار غير موجود
app.get('*', (req,res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('🔗 متصل:', socket.id);
  socket.on('message', (data) => io.emit('message', data));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏰 قلعة TARIM OS تعمل على ${PORT}`);
});
