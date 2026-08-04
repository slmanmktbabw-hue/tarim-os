/**
 * TARIM OS - السيرفر السيادي
 * الإشراف: أبو سلمان 👑
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log(`🔌 عميل سيادي متصل: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`❌ انقطع اتصال العميل: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🏰 خادم TARIM OS السيادي يعمل على المنفذ: ${PORT}`);
});
