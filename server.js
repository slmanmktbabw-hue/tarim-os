const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات مؤقتة - لاحقاً اربطها بـ MongoDB / Supabase من Render
let users = {};

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username ||!password) return res.status(400).json({ success: false });

    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = {
        username,
        password: hashedPassword,
        balance: 100,
        qr: `TARIM-QR-${username}-${Date.now()}`,
        createdAt: new Date()
    };
    res.json({ success: true, user: { username, balance: 100, qr: users[username].qr } });
});

app.get('/api/health', (req,res) => res.json({ status: 'Tarim OS Live 🛡️', time: new Date() }));

// تشفير البث السيادي - 8 دقائق
io.on('connection', (socket) => {
    socket.on('secure_message', (data) => {
        // هنا لا نعمل broadcast للجميع، بل للغرفة فقط
        io.to(data.room || 'public').emit('receive_message', data);
    });

    socket.on('start_live', (data) => {
        socket.broadcast.emit('broadcast_live', data);
        // إغلاق تلقائي بعد 8 دقائق
        setTimeout(() => {
            io.emit('end_live', { id: data.id });
        }, 8 * 60 * 1000);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Tarim OS يعمل على ${PORT}`));
