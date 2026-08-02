const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// 1. قفل CORS على موقعك فقط
const io = new Server(server, {
  cors: { origin: "https://tarimos.org", methods: ["GET", "POST"] }
});

// 2. حماية سيادية
app.use(helmet({ contentSecurityPolicy: false })); // Tailwind يبغاله inline
app.use(rateLimit({ windowMs: 60000, max: 150 })); // 150 طلب بالدقيقة

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ملفات البيانات
const POSTS_FILE = './posts.json';
const WALLET_FILE = './wallet.json';

let posts = [];
try { posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8')) } catch (e) { posts = [] }

let walletDB = { 'AL': { balance: 10000, earned: 0 } };
try { walletDB = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8')) } catch (e) { }

// 3. تنظيف ضد XSS
function sanitize(text) {
  return String(text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function savePosts() {
  try { fs.writeFileSync(POSTS_FILE, JSON.stringify(posts.slice(0, 200))) } catch (e) { }
}
function saveWallet() {
  try { fs.writeFileSync(WALLET_FILE, JSON.stringify(walletDB)) } catch (e) { }
}

// API المنشورات
app.get('/api/posts', (req, res) => res.json(posts));

app.post('/api/posts', (req, res) => {
  const newPost = {
    user: sanitize(req.body.user),
    text: sanitize(req.body.text),
    media: req.body.media || null,
    type: req.body.type || 'text',
    likes: 0,
    time: Date.now()
  };
  posts.unshift(newPost);
  savePosts();
  io.emit('broadcast_post', newPost);
  res.json({ ok: true })
});

// API المحفظة - اخفاء العنوان
app.get('/api/wallet/:user', (req, res) => {
  const u = sanitize(req.params.user) || 'AL';
  if (!walletDB[u]) walletDB[u] = { balance: 100, earned: 0 };
  res.json({
    balance: walletDB[u].balance,
    earned: walletDB[u].earned,
    address: "0x53...c0af6" // مختصر
  })
});

// API الهدايا
app.post('/api/wallet/gift', (req, res) => {
  const { from, to, gift } = req.body;
  const prices = { '🎁': 10, '❤️': 5, '👑': 50, '🚀': 100 };
  const price = prices[gift] || 10;

  if (!walletDB[from]) walletDB[from] = { balance: 100, earned: 0 };
  if (!walletDB[to]) walletDB[to] = { balance: 10000, earned: 0 };
  if (walletDB[from].balance < price) return res.status(400).json({ error: 'رصيدك لا يكفي' });

  walletDB[from].balance -= price;
  walletDB[to].balance += price * 0.7;
  walletDB[to].earned += price * 0.7;
  walletDB[from].earned += 1;

  saveWallet();
  io.emit('gift_received', { from, gift, price });
  res.json({ yourBalance: walletDB[from].balance, earned: walletDB[from].earned })
});

// API الرفع
app.post('/api/upload', (req, res) => {
  if (!req.body.videoBase64 &&!req.body.imageBase64) return res.status(400).json({ error: 'لا يوجد ملف' });
  res.json({ url: req.body.videoBase64 || req.body.imageBase64 || '' })
});

// API الدعم - شلنا الايميل
app.post('/api/support', (req, res) => {
  const user = sanitize(req.body.user);
  const replies = [
    `تم استلام رسالتك يا ${user} - سيرد الفريق خلال 24 ساعة`,
    `🛡️ فريق الدعم يراجع رسالتك الآن`,
    `تم فتح تذكرة #${Date.now()}`
  ];
  res.json({ reply: replies[Math.floor(Math.random() * replies.length)] })
});

// اي شي ثاني يرجع index.html
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('🏰 TARIM OS V11 Secure on ' + PORT + ' 👑🌍'));
