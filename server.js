const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
let bcrypt; try{ bcrypt=require('bcryptjs') }catch(e){ bcrypt=null }

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let posts = []; try{ posts=JSON.parse(fs.readFileSync('./posts.json','utf8')) }catch(e){ posts=[] }
let walletDB = {}; try{ walletDB=JSON.parse(fs.readFileSync('./wallet.json','utf8')) }catch(e){ walletDB={} }
let usersDB = {}; try{ usersDB=JSON.parse(fs.readFileSync('./users.json','utf8')) }catch(e){ usersDB={} }
let channels = []; try{ channels=JSON.parse(fs.readFileSync('./channels.json','utf8')) }catch(e){
  channels=[
    { id: 'general', name: 'عام', icon: '📺', desc: 'القناة العامة', followers: 1250, owner: 'KING' },
    { id: 'quran', name: 'قرآن', icon: '📖', desc: 'تلاوات', followers: 800, owner: 'KING' },
    { id: 'hadramout', name: 'حضرموت', icon: '🏜️', desc: 'أخبار حضرموت', followers: 650, owner: 'KING' },
    { id: 'king', name: 'الملك', icon: '👑', desc: 'قناة الملك السيادية', followers: 5000, owner: 'KING' }
  ]
}

// 👑 الملك
const KING_USER = "Gooaz@$&-#";
const KING_PASS = "GG12345123rr@#$*";
const KING_PASS_OLD = "KING123";
usersDB[KING_USER] = { pass: KING_PASS, role: "KING", created: Date.now() };
walletDB[KING_USER] = walletDB[KING_USER] || { balance: 10000, earned: 0, gifts: 0 };

let liveViewers = {};
let likeCount = 0;
let giftTotal = 0;

function saveAll(){
  try{ fs.writeFileSync('./posts.json', JSON.stringify(posts.slice(0,300))) }catch(e){}
  try{ fs.writeFileSync('./wallet.json', JSON.stringify(walletDB)) }catch(e){}
  try{ fs.writeFileSync('./users.json', JSON.stringify(usersDB)) }catch(e){}
  try{ fs.writeFileSync('./channels.json', JSON.stringify(channels)) }catch(e){}
}
function makeToken(user){ return Buffer.from(user+':'+Date.now()+':'+crypto.randomBytes(8).toString('hex')).toString('base64'); }
saveAll();

// === AUTH ===
app.post('/api/auth/register', (req,res)=>{
  const {user, pass} = req.body;
  if(!user ||!pass || user.length<2) return res.json({error:'الاسم حرفين على الأقل'});
  if(user===KING_USER) return res.json({error:'حساب الملك محمي 👑'});
  if(usersDB[user]) return res.json({error:'الاسم موجود'});
  usersDB[user] = { pass, role:'user', created:Date.now() };
  walletDB[user] = walletDB[user] || { balance:100, earned:0, gifts:0 };
  saveAll();
  res.json({ user, role:'user', token:makeToken(user) });
});

app.post('/api/auth/login', (req,res)=>{
  const {user, pass} = req.body;
  if(!user ||!pass) return res.json({error:'اكمل البيانات'});
  if(user===KING_USER){
    if(pass!==KING_PASS && pass!==KING_PASS_OLD) return res.json({error:'كلمة سر القلعة خطأ ❌'});
    return res.json({ user, role:'KING', token:makeToken(user) });
  }
  const u = usersDB[user];
  if(!u) return res.json({error:'الحساب غير موجود'});
  if(bcrypt && u.pass && u.pass.startsWith('$2a$')){ if(!bcrypt.compareSync(pass, u.pass)) return res.json({error:'كلمة السر خطأ'}); }
  else { if(u.pass!==pass) return res.json({error:'كلمة السر خطأ'}); }
  res.json({ user, role:u.role||'user', token:makeToken(user) });
});

app.get('/api/posts', (req,res)=> res.json(posts));
app.post('/api/posts', (req,res)=>{ posts.unshift({user:req.body.user,text:req.body.text,channel:req.body.channel||'عام',time:Date.now(),id:Date.now()}); saveAll(); io.emit('broadcast_post', posts); res.json({ok:true}); });

app.get('/api/channels', (req,res)=> res.json(channels));
app.post('/api/channels', (req,res)=>{
  const { name, icon, desc, user } = req.body;
  const newCh = { id: Date.now().toString(), name, icon: icon||'📺', desc: desc||'', followers: 0, owner: user };
  channels.push(newCh); saveAll(); io.emit('channels_update', channels); res.json(newCh);
});
app.post('/api/channels/:id/follow', (req,res)=>{
  const ch = channels.find(c=>c.id===req.params.id || c.name===req.params.id);
  if(ch) ch.followers++; saveAll(); io.emit('channels_update', channels); res.json({ ok: true });
});

app.get('/api/wallet/:user', (req,res)=>{ const u=req.params.user; if(!walletDB[u]) walletDB[u]={balance:100, earned:0, gifts:0}; res.json(walletDB[u]); });
app.post('/api/support', (req,res)=> res.json({ reply: 'تم استلام رسالتك يا '+req.body.user+' 🛡️ تذكرة #'+Date.now() }));
app.get('/api/ping', (req,res)=> res.json({ ok:true, msg:'TARIM OS V27.5 KING LIVE + CHANNELS 👑', king:KING_USER, users:Object.keys(usersDB).length, posts:posts.length, channels:channels.length, viewers:Object.keys(liveViewers).length }));

// === LIVE حقيقي ===
io.on('connection',socket=>{
  socket.on('join_live',data=>{ liveViewers[data.user]=Date.now(); io.emit('viewers_update', {count:Object.keys(liveViewers).length, list:liveViewers}); });
  socket.on('leave_live',data=>{ delete liveViewers[data.user]; io.emit('viewers_update', {count:Object.keys(liveViewers).length, list:liveViewers}); });
  socket.on('king_live_start',data=>{ io.emit('live_started',{user:data.user, time:Date.now()}); });
  socket.on('live_like',data=>{ likeCount++; io.emit('new_like',{user:data.user, count:likeCount}); });
  socket.on('live_comment',data=>{ io.emit('new_comment',{user:data.user, text:data.text}); });
  socket.on('live_gift',data=>{
    const {from,to,gift,value} = data;
    if(!walletDB[to]) walletDB[to]={balance:0,earned:0,gifts:0};
    walletDB[to].balance+=value; walletDB[to].gifts+=value; walletDB[to].earned+=value; giftTotal+=value; saveAll();
    io.emit('new_gift',{from,to,gift,value,total:giftTotal});
    io.emit('wallet_update',{user:to,balance:walletDB[to].balance,gifts:walletDB[to].gifts});
  });
  socket.on('end_live',()=>{ io.emit('live_ended'); liveViewers={}; likeCount=0; });
});

app.get('*', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', ()=> console.log('🏰 TARIM OS V27.5 KING LIVE + CHANNELS on '+PORT+' 👑'));
