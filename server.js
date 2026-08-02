const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: '10mb' })); // تقليل الحد الأقصى لمنع استهلاك الذاكرة وحماية السيرفر
app.use(express.static(path.join(__dirname, 'public')));

// تحميل وقراءة الملفات بشكل آمن لمنع انهيار السيرفر عند التلف
let posts = [];
try {
    if (fs.existsSync('./posts.json')) {
        posts = JSON.parse(fs.readFileSync('./posts.json', 'utf8'));
    }
} catch (e) {
    console.error("خطأ في قراءة posts.json:", e.message);
    posts = [];
}

let walletDB = { 'AL': { balance: 10000, earned: 0 } };
try {
    if (fs.existsSync('./wallet.json')) {
        walletDB = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
    }
} catch (e) {
    console.error("خطأ في قراءة wallet.json:", e.message);
}

function savePosts() {
    try {
        fs.writeFileSync('./posts.json', JSON.stringify(posts.slice(0, 200)));
    } catch (e) {
        console.error("فشل حفظ المنشورات:", e.message);
    }
}

function saveWallet() {
    try {
        fs.writeFileSync('./wallet.json', JSON.stringify(walletDB));
    } catch (e) {
        console.error("فشل حفظ المحفظة:", e.message);
    }
}

// المسارات (APIs)
app.get('/api/posts', (req, res) => res.json(posts));

app.post('/api/posts', (req, res) => {
    try {
        const { user, text, media, type } = req.body;
        if (!text && !media) return res.status(400).json({ error: 'المحتوى فارغ' });
        
        const newPost = { user: user || 'AL', text: text || '', media: media || null, type: type || 'text', likes: 0, time: Date.now() };
        posts.unshift(newPost);
        savePosts();
        io.emit('broadcast_post', newPost);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

app.get('/api/wallet/:user', (req, res) => {
    const u = req.params.user || 'AL';
    if (!walletDB[u]) walletDB[u] = { balance: 100, earned: 0 };
    res.json(walletDB[u]);
});

app.post('/api/wallet/gift', (req, res) => {
    try {
        const { from, to, gift } = req.body;
        const prices = { '🎁': 10, '❤️': 5, '👑': 50, '🚀': 100 };
        const price = prices[gift] || 10;

        if (!walletDB[from]) walletDB[from] = { balance: 100, earned: 0 };
        if (!walletDB[to]) walletDB[to] = { balance: 10000, earned: 0 };

        if (walletDB[from].balance < price) return res.json({ error: 'رصيدك لا يكفي' });

        walletDB[from].balance -= price;
        walletDB[to].balance += price * 0.7;
        walletDB[to].earned += price * 0.7;
        walletDB[from].earned += 1;

        saveWallet();
        io.emit('gift_received', { from, gift, price });
        res.json({ yourBalance: walletDB[from].balance, earned: walletDB[from].earned });
    } catch (e) {
        res.status(500).json({ error: 'خطأ في معالجة الهدية' });
    }
});

app.post('/api/upload', (req, res) => res.json({ url: req.body.videoBase64 || '' }));

app.post('/api/support', (req, res) => {
    const user = req.body.user || 'زائر';
    const replies = [
        `تم استلام رسالتك يا ${user} - سيرد الفريق على slmanmktbabw@gmail.com`,
        '🛡️ فريق الدعم يراجع رسالتك الآن',
        'تم فتح تذكرة #' + Date.now()
    ];
    res.json({ reply: replies[Math.floor(Math.random() * replies.length)] });
});

// التعامل مع الأخطاء العامة لمنع انهيار السيرفر (Uncaught Exception & Rejection)
process.on('uncaughtException', (err) => {
    console.error('خطأ غير معالج أدى لتجنب الانهيار:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('رفض وعد غير معالج:', reason);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('TARIM OS V10 Secure Server on ' + PORT));
