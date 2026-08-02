const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let posts = []; try{ posts=JSON.parse(fs.readFileSync('./posts.json','utf8')) }catch(e){ posts=[] }
let walletDB = {}; try{ walletDB=JSON.parse(fs.readFileSync('./wallet.json','utf8')) }catch(e){ walletDB={'Gooaz@$&-#':{balance:10000,earned:0}} }
let usersDB = {}; try{ usersDB=JSON.parse(fs.readFileSync('./users.json','utf8')) }catch(e){ usersDB={} }

// 👑 حساب الملك الوحيد - لا أحد يدخله غيرك
const KING_USER = "Gooaz@$&-#";
const KING_PASS = "GG12345123rr@#$*";
usersDB[KING_USER] = { pass: KING_PASS, role: "KING", created: Date.now() };
walletDB[KING_USER] = walletDB[KING_USER] || { balance: 10000, earned: 0 };

function saveAll(){
  try{ fs.writeFileSync('./posts.json', JSON.stringify(posts.slice(0,200))) }catch(e){}
  try{ fs.writeFileSync('./wallet.json', JSON.stringify(walletDB)) }catch(e){}
  try{ fs.writeFileSync('./users.json', JSON.stringify(usersDB)) }catch(e){}
}
function makeToken(user){ return Buffer.from(user+':'+Date.now()+':'+crypto.randomBytes(8).toString('hex')).toString('base64'); }
saveAll();

app.post('/api/auth/register', (req,res)=>{
  const {user, pass} = req.body;
  if(!user ||!pass || user.length<2 || pass.length<3) return res.json({error:'الاسم حرفين والباسورد 3 حروف على الأقل'});
  if(user===KING_USER) return res.json({error:'حساب الملك محمي 👑 - ممنوع التسجيل بهذا الاسم'});
  if(usersDB[user]) return res.json({error:'الاسم موجود - سجل دخول'});
  usersDB[user] = { pass, role:'user', created:Date.now() };
  walletDB[user] = walletDB[user] || { balance:100, earned:0 };
  saveAll();
  res.json({ user, role:'user', token:makeToken(user) });
});

app.post('/api/auth/login', (req,res)=>{
  const {user, pass} = req.body;
  if(!user ||!pass) return res.json({error:'اكمل البيانات'});
  if(user===KING_USER){
    if(pass!==KING_PASS) return res.json({error:'كلمة سر القلعة خطأ ❌ - حساب محمي'});
    return res.json({ user, role:'KING', token:makeToken(user) });
  }
  const u = usersDB[user];
  if(!u) return res.json({error:'الحساب غير موجود - أنشئ حساب جديد ✨'});
  if(u.pass!==pass) return res.json({error:'كلمة السر خطأ ❌'});
  res.json({ user, role:u.role||'user', token:makeToken(user) });
});

app.get('/api/posts', (req,res)=> res.json(posts));
app.post('/api/posts', (req,res)=>{ posts.unshift(req.body); saveAll(); io.emit('broadcast_post', posts); res.json({ok:true}); });
app.get('/api/wallet/:user', (req,res)=>{ const u=req.params.user||KING_USER; if(!walletDB[u]) walletDB[u]={balance:100, earned:0}; res.json(walletDB[u]); });
app.post('/api/support', (req,res)=>{ res.json({ reply: 'تم استلام رسالتك يا '+req.body.user+' - تذكرة #'+Date.now()+' 🛡️' }); });
app.get('/api/ping', (req,res)=> res.json({ ok:true, msg:'TARIM OS KING LIVE 👑', king:KING_USER, users:Object.keys(usersDB).length }));
app.get('*', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', ()=> console.log('🏰 TARIM OS V23.1 KING LIVE on '+PORT+' - KING: '+KING_USER+' 👑'));
