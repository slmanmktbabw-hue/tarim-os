const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 1e8 });

app.use(cors({origin:"*"}));
app.use(express.json({limit:'100mb'}));
app.use(express.static(path.join(__dirname, 'public')));

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive:true});
app.use('/uploads', express.static(uploadDir));

// بيانات سيادية
const S = { KING:'AL', WALLET:'0x53ce5e429ac48f355b775e418ded0b13931c0af6', DOMAIN:'tarimos.org' };
let posts = [{id:'1', user:'الإمبراطور AL', text:'أهلاً بكم في منظومة tarimos.org العالمية - انطلاق البث المباشر والتفاعل.', likes:1250, time: Date.now()}];
let balances = {'AL':10000};

// محفظة الجمهور + أرباح + دعم
let supportTickets=[];
let walletDB={'AL':{balance:10000, earned:0}};
const GIFT_PRICE={'❤️':1,'🌹':5,'🎁':10,'💎':50,'👑':100,'🚀':500};

// ========= كل الـ API قبل * =========
app.get('/api/posts', (req,res)=>res.json(posts));
app.post('/api/posts', (req,res)=>{
  const p={id:Date.now().toString(), likes:0, time:Date.now(), ...req.body};
  posts.unshift(p); io.emit('broadcast_post', p);
  res.json({ok:1, post:p});
});
app.get('/api/wallet', (req,res)=>res.json(S));

app.post('/api/upload', (req,res)=>{
  try{
    const {videoBase64, name}=req.body;
    if(!videoBase64) return res.status(400).json({error:'no video'});
    const fileName=(name||Date.now())+'.webm';
    const filePath=path.join(uploadDir,fileName);
    const base64Data=videoBase64.replace(/^data:video\/\w+;base64,/, "");
    fs.writeFileSync(filePath,base64Data,'base64');
    res.json({ok:1, url:`/uploads/${fileName}`});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/gift',(req,res)=>{
  const {from,to,amount}=req.body; const amt=parseInt(amount)||10;
  if(!balances[from]) balances[from]=1000;
  if(balances[from]>=amt){
    balances[from]-=amt; if(!balances[to]) balances[to]=0; balances[to]+=amt;
    io.emit('gift',req.body); res.json({ok:1,balance:balances[from]});
  } else res.json({error:'رصيد ناقص'});
});
app.get('/api/balance/:user,(req,res)=>res.json({balance:balances[req.params.user]||0}));

// محفظة الجمهور الحقيقية
app.post('/api/support',(req,res)=>{
  supportTickets.push({...req.body,time:Date.now()});
  console.log('تذكرة دعم:',req.body);
  res.json({ok:1, reply:'تم استلام رسالتك يا '+req.body.user+' - سيرد فريق الدعم خلال دقيقة. تواصل مباشر: slmanmktbabw@gmail.com'});
});
app.get('/api/support',(_,res)=>res.json(supportTickets));

app.post('/api/wallet/gift',(req,res)=>{
  const {from,to,gift}=req.body; const price=GIFT_PRICE[gift]||1;
  if(!walletDB[from]) walletDB[from]={balance:1000,earned:0};
  if(!walletDB[to]) walletDB[to]={balance:0,earned:0};
  if(walletDB[from].balance < price) return res.json({error:'رصيدك ناقص - اشحن'});
  walletDB[from].balance-=price;
  const earn=Math.floor(price*0.7);
  walletDB[to].earned+=earn; walletDB[to].balance+=earn;
  io.emit('gift_received',{from,to,gift,price,earn});
  res.json({ok:1, yourBalance:walletDB[from].balance, earned:earn});
});

// هذا هو السطر اللي كان فيه خطأ - صححته
app.get('/api/wallet/:user',(req,res)=>{
  res.json(walletDB[req.params.user]||{balance:0,earned:0});
});

// ========= أمني قبل io.on =========
io.use((socket,next)=>{
  console.log('اتصال ميداني:',socket.handshake.address);
  next();
});

io.on('connection',(socket)=>{
  console.log('متصل:',socket.id);
  socket.on('new_post',d=>io.emit('broadcast_post',d));
  socket.on('live_like',d=>io.emit('live_like',d));
  socket.on('live_comment',d=>io.emit('live_comment',d));
  socket.on('disconnect',()=>console.log('غادر:',socket.id));
});

// ========= آخر شي =========
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`TARIM OS V8 Global Wallet on ${PORT}`));
