const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let posts = [];
try { posts = JSON.parse(fs.readFileSync('./posts.json','utf8')); } catch(e){ posts=[]; }

let walletDB = { 'AL': { balance: 10000, earned: 0 } };
try { walletDB = JSON.parse(fs.readFileSync('./wallet.json','utf8')); } catch(e){}

function savePosts(){ try{fs.writeFileSync('./posts.json', JSON.stringify(posts.slice(0,200)));}catch(e){} }
function saveWallet(){ try{fs.writeFileSync('./wallet.json', JSON.stringify(walletDB));}catch(e){} }

app.get('/api/posts', (req,res)=> res.json(posts));
app.post('/api/posts', (req,res)=>{
  posts.unshift(req.body); savePosts(); io.emit('broadcast_post', req.body); res.json({ok:true});
});

app.get('/api/wallet/:user', (req,res)=>{
  const u = req.params.user || 'AL';
  if(!walletDB[u]) walletDB[u] = { balance: 100, earned: 0 };
  res.json(walletDB[u]);
});

app.post('/api/wallet/gift', (req,res)=>{
  const { from, to, gift } = req.body;
  const prices = { '🎁': 10, '❤️': 5, '👑': 50, '🚀': 100 };
  const price = prices[gift] || 10;
  if(!walletDB[from]) walletDB[from] = { balance: 100, earned: 0 };
  if(!walletDB[to]) walletDB[to] = { balance: 10000, earned: 0 };
  if(walletDB[from].balance < price) return res.json({ error: 'رصيدك لا يكفي' });
  walletDB[from].balance -= price;
  walletDB[to].balance += price * 0.7;
  walletDB[to].earned += price * 0.7;
  walletDB[from].earned += 1;
  saveWallet();
  io.emit('gift_received', { from, gift, price });
  res.json({ yourBalance: walletDB[from].balance, earned: walletDB[from].earned });
});

app.post('/api/upload', (req,res)=>{
  res.json({ url: req.body.videoBase64 || '' });
});

app.post('/api/support', (req,res)=>{
  const replies = ['تم استلام رسالتك يا '+req.body.user+' - سيرد الفريق على slmanmktbabw@gmail.com', '🛡️ فريق الدعم العالمي يراجع رسالتك الآن', 'تم فتح تذكرة دعم - رقم #'+Date.now()];
  res.json({ reply: replies[Math.floor(Math.random()*replies.length)] });
});

app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('TARIM OS V10 Global on '+PORT));
