const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8 
});

app.use(cors({origin:"*"}));
app.use(express.json({limit:'100mb'}));
app.use(express.static(path.join(__dirname, 'public')));

// مجلد رفع الفيديو
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive:true});
app.use('/uploads', express.static(uploadDir));

// بياناتك السيادية
const S = { 
  KING:'AL', 
  WALLET:'0x53ce5e429ac48f355b775e418ded0b13931c0af6', 
  DOMAIN:'tarimos.org' 
};

let posts = [
  {id:'1', user:'الإمبراطور AL', text:'أهلاً بكم في منظومة tarimos.org العالمية - انطلاق البث المباشر والتفاعل.', likes:1250, time: Date.now()}
];

// API - لازم قبل الـ *
app.get('/api/posts', (req,res)=>res.json(posts));
app.post('/api/posts', (req,res)=>{
  const p={id:Date.now().toString(), likes:0, time:Date.now(), ...req.body};
  posts.unshift(p);
  io.emit('broadcast_post', p);
  res.json({ok:1, post:p});
});
app.get('/api/wallet', (req,res)=>res.json(S));

// رفع الفيديو TikTok - base64 - لازم قبل الـ *
app.post('/api/upload', (req,res)=>{
  try{
    const {videoBase64, name} = req.body;
    if(!videoBase64) return res.status(400).json({error:'no video'});
    const fileName = (name||Date.now()) + '.webm';
    const filePath = path.join(uploadDir, fileName);
    const base64Data = videoBase64.replace(/^data:video\/\w+;base64,/, "");
    fs.writeFileSync(filePath, base64Data, 'base64');
    const url = `/uploads/${fileName}`;
    res.json({ok:1, url});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// هذه لازم تكون آخر شي
app.get('*', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

// Socket - البث الحي TikTok Style
io.on('connection', (socket)=>{
  console.log('مستخدم متصل:', socket.id);
  socket.on('new_post', (data)=>io.emit('broadcast_post', data));
  socket.on('disconnect', ()=>console.log('غادر:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log(`TARIM OS TikTok Global on ${PORT}`));
