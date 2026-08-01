// TARIM OS V11.1 Sovereign - server.js - عالمي 100%
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
if(!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR,{recursive:true});

const USERS_FILE = path.join(DATA_DIR,'users.json');
const POSTS_FILE = path.join(DATA_DIR,'posts.json');
const WALLET_FILE = path.join(DATA_DIR,'wallet.json');

function loadJSON(file, def){ try{ if(!fs.existsSync(file)) return def; return JSON.parse(fs.readFileSync(file,'utf8')); }catch(e){ return def; } }
function saveJSON(file, data){ fs.writeFileSync(file, JSON.stringify(data,null,2)); }
function esc(s){ if(!s) return ''; return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).slice(0,1000); }

let users = loadJSON(USERS_FILE, {});
let posts = loadJSON(POSTS_FILE, []);
let wallets = loadJSON(WALLET_FILE, {});

const GIFT_PRICES = { '🎁':10, '❤️':5, '👑':50, '🚀':100, '💎':20, '🌹':15, '🏰':200 };
let giftCooldown = {};

app.use(helmet({ contentSecurityPolicy:false, crossOriginEmbedderPolicy:false }));
app.use(cors({ origin:"*" }));
app.use(express.json({ limit:"10mb" }));
app.use(express.static(PUBLIC_DIR));

const limiter = rateLimit({ windowMs:60*1000, max:120 });
app.use('/api/', limiter);

// 1- تعريف الدومين في الاستضافة + الأساس اعتماد بيانات المستخدم + حماية حساب
app.post('/api/register', async (req,res)=>{
  try{
    let {user, pass} = req.body;
    if(!user ||!pass) return res.json({error:'بيانات ناقصة'});
    user = String(user).trim().toUpperCase().slice(0,20).replace(/[^A-Z0-9_]/g,'');
    if(user.length<2) return res.json({error:'اسم قصير'});
    if(pass.length<3) return res.json({error:'كلمة المرور قصيرة'});
    if(users[user]){
      const ok = await bcrypt.compare(pass, users[user].hash);
      if(!ok) return res.json({error:'كلمة المرور خطأ'});
    }else{
      const hash = await bcrypt.hash(pass, 10);
      users[user] = { hash, okx:'0x53ce5e429ac48f355b775e418ded0b13931c0af6', created:Date.now() };
      saveJSON(USERS_FILE, users);
      wallets[user] = { userId:user, balance:1000, diamonds:50, earned:0, transactions:[] };
      saveJSON(WALLET_FILE, wallets);
    }
    if(!wallets[user]){ wallets[user]={userId:user,balance:1000,diamonds:50,earned:0,transactions:[]}; saveJSON(WALLET_FILE,wallets); }
    res.json({ ok:true, user });
  }catch(e){ res.json({error:'خطأ سيرفر'}); }
});

// 2- منشورات - تخزين بيانات + فيديو 700KB
app.get('/api/posts', (req,res)=>{ res.json(posts.slice(-100).reverse()); });
app.post('/api/posts', (req,res)=>{
  let {user, text, media, type} = req.body;
  if(!user) user='AL';
  if(media && media.length>700000) media = media.slice(0,700000);
  const post = { id:Date.now(), user:esc(user).slice(0,20), text:esc(text).slice(0,500), media:(media||'').slice(0,700000), type:(type||'text').slice(0,20), likes:0, time:Date.now() };
  posts.push(post); if(posts.length>500) posts.shift();
  saveJSON(POSTS_FILE, posts);
  res.json({ok:true});
});

// رفع فيديو بث 8 دقائق
app.post('/api/upload', (req,res)=>{
  const {videoBase64, name} = req.body;
  if(!videoBase64) return res.json({error:'لا يوجد فيديو'});
  if(videoBase64.length> 15*1024*1024) return res.json({error:'فيديو كبير'});
  res.json({url: videoBase64, name});
});

// 3- قاعدة البيانات رصيد + هدايا + منطق خصم وإضافة
app.get('/api/wallet/:user', (req,res)=>{
  const u = esc(req.params.user).toUpperCase().slice(0,20);
  let w = wallets[u];
  if(!w){ w={userId:u,balance:1000,diamonds:50,earned:0,transactions:[]}; wallets[u]=w; saveJSON(WALLET_FILE,wallets); }
  res.json(w);
});

app.post('/api/wallet/gift', (req,res)=>{
  let {from, to, gift} = req.body;
  from = esc(from).toUpperCase().slice(0,20); to = esc(to||'AL').toUpperCase().slice(0,20);
  gift = String(gift).slice(0,10);
  const price = GIFT_PRICES[gift]||10;
  if(giftCooldown[from] && Date.now()-giftCooldown[from]<2000) return res.json({error:'اهدأ ثانيتين ⏳'});
  const fw = wallets[from]; if(!fw) return res.json({error:'محفظة غير موجودة'});
  if(fw.balance < price) return res.json({error:'رصيدك لا يكفي - اشحن عبر OKX'});
  let tw = wallets[to]; if(!tw){ tw={userId:to,balance:0,diamonds:0,earned:0,transactions:[]}; wallets[to]=tw; }
  fw.balance -= price;
  const earn = Math.floor(price*0.7);
  tw.balance += earn; tw.earned += earn; tw.diamonds += 1;
  fw.transactions.push({type:'send', gift, price, to, time:Date.now()});
  tw.transactions.push({type:'receive', gift, earn, from, time:Date.now()});
  giftCooldown[from]=Date.now();
  saveJSON(WALLET_FILE, wallets);
  io.emit('gift_received',{from,gift,price,earn});
  res.json({ok:true, yourBalance:fw.balance, earned:earn, price});
});

// 4- Gemini + دعم
app.post('/api/ai', (req,res)=>{
  const p = esc(req.body.prompt||'').slice(0,200);
  res.json({reply:`👁️ عين الذكاء حللت: "${p}" - النظام السيادي جاهز 🌍 تريم حضرموت - OKX 0x53ce...af6`});
});
app.post('/api/support', (req,res)=>{
  const t = esc(req.body.text||'').slice(0,500);
  res.json({reply:`🛡️ تم استلام: "${t}" - فريق الدعم slmanmktbabw@gmail.com سيرد قريباً`});
});

app.get('/privacy.html', (req,res)=>{ res.sendFile(path.join(PUBLIC_DIR,'privacy.html')); });

io.on('connection', socket=>{
  socket.on('new_post', p=>{ socket.broadcast.emit('broadcast_post', p); });
  socket.on('live_like', d=>{ io.emit('live_like', d); });
  socket.on('live_comment', d=>{ io.emit('live_comment', {user:esc(d.user), text:esc(d.text)}); });
  socket.on('private_message', d=>{ io.emit('private_message', {user:esc(d.user), text:esc(d.text)}); });
  socket.on('gift_received', d=>{ io.emit('gift_received', d); });
});

server.listen(PORT, ()=>{ console.log(`🏰 TARIM OS V11.1 running on ${PORT} - tarimos.org - OKX 0x53ce...af6`); });
