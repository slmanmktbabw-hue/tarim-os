const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 👑 الملك الثابت - لا ينحذف ابدا
const KING_USER = "Gooaz@$&-#";
const KING_PASS = "GG12345123rr@#$*";
const KING_ALIASES = ["gooaz@$&-#", "#-&$@gooaz", "gooaz", "goooaz"];

let posts = [];
let walletDB = {};
let usersDB = {};

try{ posts=JSON.parse(fs.readFileSync('./posts.json','utf8')) }catch(e){ posts=[] }
try{ walletDB=JSON.parse(fs.readFileSync('./wallet.json','utf8')) }catch(e){ walletDB={} }
try{ usersDB=JSON.parse(fs.readFileSync('./users.json','utf8')) }catch(e){ usersDB={} }

// ثبت الملك دائما
usersDB[KING_USER] = { pass: KING_PASS, role: "KING" };
walletDB[KING_USER] = { balance: 10000, earned: 10000, gifts: 999 };

function saveAll(){
  try{ fs.writeFileSync('./posts.json', JSON.stringify(posts.slice(0,200))) }catch(e){}
  try{ fs.writeFileSync('./wallet.json', JSON.stringify(walletDB)) }catch(e){}
  try{ fs.writeFileSync('./users.json', JSON.stringify(usersDB)) }catch(e){}
}
function isKingName(u){
  if(!u) return false;
  u = String(u).toLowerCase().trim();
  return KING_ALIASES.some(a => u.includes(a) || a.includes(u)) || u.includes('goo');
}
saveAll();

app.post('/api/auth/register', (req,res)=>{
  let {user, pass} = req.body;
  user = String(user||'').trim();
  if(isKingName(user)) return res.json({error:'حساب الملك محمي 👑 - ممنوع التسجيل بهذا الاسم'});
  if(!user ||!pass) return res.json({error:'اكمل البيانات'});
  if(usersDB[user]) return res.json({error:'الاسم موجود - سجل دخول'});
  usersDB[user] = { pass, role:'user' };
  walletDB[user] = { balance:100, earned:0 };
  saveAll();
  res.json({ user, role:'user', token:'ok' });
});

app.post('/api/auth/login', (req,res)=>{
  let {user, pass} = req.body;
  user = String(user||'').trim();
  pass = String(pass||'').trim();
  console.log('LOGIN TRY:', user);

  // دخول الملك - يقبل كل الكتابات + كلمة GG123 او الكلمة الكاملة
  if(isKingName(user)){
    if(pass.includes('GG') || pass.includes('123') || pass === KING_PASS || pass.toLowerCase().includes('king')){
      return res.json({ user: KING_USER, role:'KING', balance:10000, token:'KING_TOKEN' });
    }else{
      return res.json({error:'كلمة سر الملك: GG12345123rr@#$*'});
    }
  }

  if(!usersDB[user]) return res.json({error:'الحساب غير موجود'});
  if(usersDB[user].pass!== pass) return res.json({error:'كلمة السر خطأ'});
  res.json({ user, role:usersDB[user].role, token:'ok' });
});

app.get('/api/posts', (req,res)=> res.json(posts));
app.post('/api/posts', (req,res)=>{
  posts.unshift({user:req.body.user, text:req.body.text, time:Date.now()});
  saveAll();
  io.emit('broadcast_post', posts);
  res.json({ok:true});
});

app.get('/api/wallet/:user', (req,res)=>{
  let u = String(req.params.user||'');
  // الملك دائما 10000 حتى لو الملف انحذف
  if(isKingName(u) || u === KING_USER){
    walletDB[KING_USER] = { balance:10000, earned:10000, gifts:999 };
    return res.json(walletDB[KING_USER]);
  }
  if(!walletDB[u]) walletDB[u] = { balance:100, earned:0 };
  res.json(walletDB[u]);
});

app.get('/api/ping', (req,res)=> res.json({ ok:true, ver:'V31.5 FINAL PERSISTENT', king:KING_USER, users:Object.keys(usersDB).length }));

app.get('*', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

server.listen(process.env.PORT||10000, '0.0.0.0', ()=> console.log('🏰 TARIM OS V31.5 FINAL PERSISTENT 10000 LIVE on 10000 👑🌍'));
