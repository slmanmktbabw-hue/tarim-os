// server.js - TARIM OS V1 FINAL - STABLE - يفتح غصباً 🏰
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({origin:"*"}));
app.use(express.json({limit:'100mb'}));
app.use(express.static(path.join(__dirname, 'public')));

// API بسيط - ما يطيح
app.get('/api/ping', (req,res)=>{
  res.json({ok:true, msg:'TARIM OS LIVE 🏰', king:'AL', site:'tarimos.org', time:new Date().toISOString()});
});

// تسجيل دخول يفتح مباشر - ما يحتاج ملفات ثانية
app.post('/api/auth/login', (req,res)=>{
  const {username,password} = req.body;
  if(username==='AL' && password==='Gooaz@$&-#'){
    return res.json({ok:true, user:'AL', token:'KING_TOKEN_'+Date.now()});
  }
  // أي يوزر ثاني يدخل تجريبي عشان ما يعلق
  res.json({ok:true, user:username||'guest', token:'GUEST_'+Date.now()});
});

app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname,'public','index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT,'0.0.0.0',()=>{
  console.log(`🏰 TARIM OS LIVE on ${PORT} - KING AL`);
});
