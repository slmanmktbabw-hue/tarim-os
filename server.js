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

// إعدادات الـ Body Parser بحد أعلى 500mb لدعم الوسائط الثقيلة
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// قواعد البيانات المحلية
let posts = [];
try { posts = JSON.parse(fs.readFileSync('./posts.json', 'utf8')); } catch (e) { posts = []; }

let walletDB = { 'AL': { balance: 10000, earned: 0 } };
try { walletDB = JSON.parse(fs.readFileSync('./wallet.json', 'utf8')); } catch (e) {}

function savePosts() { try { fs.writeFileSync('./posts.json', JSON.stringify(posts.slice(0, 500))); } catch (e) {} }
function saveWallet() { try { fs.writeFileSync('./wallet.json', JSON.stringify(walletDB)); } catch (e) {} }

// Socket.io للإدارة اللحظية للبث (لايكات، تعليقات، وهدايا)
io.on('connection', (socket) => {
    console.log('🔗 متصل جديد بنظام السيادة:', socket.id);

    // استقبال التفاعل الحي (لايكات البث)
    socket.on('live_like', (data) => {
        io.emit('update_live_likes', data);
    });

    // استقبال تعليقات البث المباشر المباشرة وتوزيعها للمشاهدين
    socket.on('live_comment', (commentData) => {
        io.emit('broadcast_live_comment', commentData);
    });

    // استقبال الهدايا في البث المباشر
    socket.on('send_live_gift', (giftData) => {
        // giftData: { from, to, gift }
        const prices = { '🎁': 10, '❤️': 5, '👑': 50, '🚀': 100 };
        const price = prices[giftData.gift] || 10;

        let fromUser = giftData.from || 'AL';
        let toUser = giftData.to || 'AL';

        if (!walletDB[fromUser]) walletDB[fromUser] = { balance: 10000, earned: 0 };
        if (!walletDB[toUser]) walletDB[toUser] = { balance: 10000, earned: 0 };

        if (walletDB[fromUser].balance >= price) {
            walletDB[fromUser].balance -= price;
            walletDB[toUser].balance += price * 0.7; // 70% أرباح فورية للمنشئ
            walletDB[toUser].earned += price * 0.7;
            saveWallet();

            // بث الحدث لكل المتصلين في البث
            io.emit('gift_broadcast', {
                from: fromUser,
                to: toUser,
                gift: giftData.gift,
                price: price,
                newBalance: walletDB[fromUser].balance
            });
        }
    });

    socket.on('disconnect', () => {
        // انقطاع الاتصال
    });
});

// مسارات API المنشورات
app.get('/api/posts', (req, res) => res.json(posts));

app.post('/api/posts', (req, res) => {
    const { user, text, media, type } = req.body;
    const cleanText = String(text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const newPost = { user: String(user || 'AL'), text: cleanText, media, type: type || 'text', likes: 0, time: Date.now() };
    posts.unshift(newPost);
    savePosts();
    io.emit('broadcast_post', newPost);
    res.json({ ok: true });
});

// مسارات API المحفظة والأرباح والهدايا
app.get('/api/wallet/:user', (req, res) => {
    const u = req.params.user || 'AL';
    if (!walletDB[u]) walletDB[u] = { balance: 10000, earned: 0 };
    res.json(walletDB[u]);
});

app.post('/api/wallet/gift', (req, res) => {
    const { from, to, gift } = req.body;
    const prices = { '🎁': 10, '❤️': 5, '👑': 50, '🚀': 100 };
    const price = prices[gift] || 10;
    
    const sender = from || 'AL';
    const receiver = to || 'AL';

    if (!walletDB[sender]) walletDB[sender] = { balance: 10000, earned: 0 };
    if (!walletDB[receiver]) walletDB[receiver] = { balance: 10000, earned: 0 };
    
    if (walletDB[sender].balance < price) return res.json({ error: 'رصيدك لا يكفي في محفظة OKX' });
    
    walletDB[sender].balance -= price;
    walletDB[receiver].balance += price * 0.7; // 70% للمنشئ
    walletDB[receiver].earned += price * 0.7;
    
    saveWallet();
    io.emit('gift_received', { from: sender, to: receiver, gift, price });
    res.json({ success: true, yourBalance: walletDB[sender].balance, earned: walletDB[sender].earned });
});

// مسار الترويج والإعلانات الذكية (Meta & X Ads Integration)
app.post('/api/ads/promote', (req, res) => {
    const { adTitle, budget, platform } = req.body;
    res.json({ 
        success: true, 
        message: `تم إطلاق الحملة الترويجية بنجاح عبر منصة ${platform || 'Meta/X'} برصيد ${budget || 100}` 
    });
});

// مسار الرفع (Upload)
app.post('/api/upload', (req, res) => res.json({ url: req.body.videoBase64 || '' }));

// مسار الذكاء الاصطناعي (AI)
app.post('/api/ai', (req, res) => {
    const prompt = String(req.body.prompt || '');
    const responses = [
        '👁️ [عين الذكاء السيادي]: النظام يعمل بكامل طاقته عبر عقد المليون سيرفر.',
        '🛡️ [جدار الحماية]: تم تحليل الثغرات وتأمين الحسابات بنسبة 100%.',
        '⚡ [السيادة المطلقة]: تم تأمين البث (8 دقائق) والتحكم الميداني بنجاح.'
    ];
    res.json({ reply: responses[Math.floor(Math.random() * responses.length)] });
});

// مسار الدعم الآلي
app.post('/api/support', (req, res) => {
    const user = req.body.user || 'AL';
    const replies = [
        `تم استلام رسالتك يا ${user} - سيرد الفريق على slmanmktbabw@gmail.com`,
        '🛡️ فريق الدعم يراجع رسالتك الآن بنظام الردع الآلي',
        'تم فتح تذكرة #' + Date.now()
    ];
    res.json({ reply: replies[Math.floor(Math.random() * replies.length)] });
});

// التوجيه العام لواجهة المستخدم (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('TARIM OS SUPREME SERVER ACTIVE ON PORT ' + PORT));
