const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// حماية ضد الهجمات وانهيار السيرفرات (Rate Limiting ذكي)
const requestLimit = new Map();
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    if (!requestLimit.has(ip)) {
        requestLimit.set(ip, { count: 1, time: now });
    } else {
        let data = requestLimit.get(ip);
        if (now - data.time < 60000) {
            data.count++;
            if (data.count > 300) return res.status(429).json({ error: 'تم حظر الطلب مؤقتاً لحماية سيادة السيرفر' });
        } else {
            data.count = 1;
            data.time = now;
        }
    }
    next();
});

app.use(express.json({ limit: '500mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let posts = [];
try { posts = JSON.parse(fs.readFileSync('./posts.json', 'utf8')); } catch (e) { posts = []; }

let walletDB = { 'AL': { balance: 10000, earned: 0 } };
try { walletDB = JSON.parse(fs.readFileSync('./wallet.json', 'utf8')); } catch (e) {}

function savePosts() { try { fs.writeFileSync('./posts.json', JSON.stringify(posts.slice(0, 500))); } catch (e) {} }
function saveWallet() { try { fs.writeFileSync('./wallet.json', JSON.stringify(walletDB)); } catch (e) {} }

app.get('/api/posts', (req, res) => res.json(posts));
app.post('/api/posts', (req, res) => {
    const { user, text, media, type } = req.body;
    const cleanText = String(text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const newPost = { user: String(user || 'AL'), text: cleanText, media, type, likes: 0, time: Date.now() };
    posts.unshift(newPost);
    savePosts();
    io.emit('broadcast_post', newPost);
    res.json({ ok: true });
});

app.get('/api/wallet/:user', (req, res) => {
    const u = req.params.user || 'AL';
    if (!walletDB[u]) walletDB[u] = { balance: 10000, earned: 0 };
    res.json(walletDB[u]);
});

app.post('/api/ai', (req, res) => {
    const prompt = String(req.body.prompt || '');
    const responses = [
        '👁️ [عين الذكاء السيادي]: النظام يعمل بكامل طاقته عبر عقد المليون سيرفر.',
        '🛡️ [جدار الحماية]: تم تحليل الثغرات وتأمين الحسابات بنسبة 100%.',
        '⚡ [السيادة المطلقة]: تم تأمين البث (8 دقائق) والتحكم الميداني بنجاح.'
    ];
    res.json({ reply: responses[Math.floor(Math.random() * responses.length)] });
});

app.post('/api/support', (req, res) => {
    res.json({ reply: '🛡️ فريق الدعم السيادي يعمل بنظام الردع الآلي - slmanmktbabw@gmail.com' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('TARIM OS SUPREME SERVER ACTIVE ON PORT ' + PORT));
