const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const fs=require('fs');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const helmet=require('helmet');
const cors=require('cors');
const rateLimit=require('express-rate-limit');

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});

const JWT_SECRET="TARIM_OS_KING_2026_SECURE_"+Date.now();
const KING_USER="Gooaz@$&-#";
const KING_PASS="GG12345123rr@#$*";
const KING_PASS2="KING123";

// حماية سيادية
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(cors({origin:"*"}));
app.use(express.json({limit:'10mb'}));
app.use(express.static(path.join(__dirname,'public')));

// منع الهجوم
const limiter=rateLimit({windowMs:60*1000,max:100,message:{error:'كثرة طلبات - انتظر'}});
app.use('/api/',limiter);
const authLimiter=rateLimit({windowMs:15*60*1000,max:20,message:{error:'محاولات كثيرة - انتظر 15 دقيقة'}});

let posts=[];try{posts=JSON.parse(fs.readFileSync('./posts.json','utf8'))}catch(e){}
let wallets={};try{wallets=JSON.parse(fs.readFileSync('./wallet.json','utf8'))}catch(e){}
let users={};try{users=JSON.parse(fs.readFileSync('./users.json','utf8'))}catch(e){}

if(!users[KING_USER]) users[KING_USER]={pass:bcrypt.hashSync(KING_PASS,10),role:'KING',created:Date.now()};
if(!wallets[KING_USER]) wallets[KING_USER]={balance:10000,gifts:0,earned:0};

let live={on:false,owner:null,viewers:{},likes:0,gifts:0};

function save(){try{fs.writeFileSync('./posts.json',JSON.stringify(posts.slice(0,500)))}catch(e){}try{fs.writeFileSync('./wallet.json',JSON.stringify(wallets))}catch(e){}try{fs.writeFileSync('./users.json',JSON.stringify(users))}catch(e){}}
function sanitize(t){return String(t||'').slice(0,500).replace(/[<>]/g,'');}
function makeJWT(user,role){return jwt.sign({user,role},JWT_SECRET,{expiresIn:'7d'});}

// === AUTH آمن ===
app.post('/api/auth/register',authLimiter,(req,res)=>{
 let {user,pass}=req.body;user=sanitize(user);if(!user||!pass||user.length<3)return res.json({error:'الاسم 3 أحرف على الأقل'});if(user===KING_USER)return res.json({error:'حساب الملك محمي 👑'});if(users[user])return res.json({error:'الاسم موجود'});users[user]={pass:bcrypt.hashSync(pass,10),role:'user',created:Date.now()};wallets[user]={balance:100,gifts:0,earned:0};save();res.json({user,role:'user',token:makeJWT(user,'user')});
});
app.post('/api/auth/login',authLimiter,(req,res)=>{
 let {user,pass}=req.body;user=sanitize(user);const u=users[user];if(!u)return res.json({error:'الحساب غير موجود'});const ok=(user===KING_USER)?(pass===KING_PASS||pass===KING_PASS2||bcrypt.compareSync(pass,u.pass)):bcrypt.compareSync(pass,u.pass);if(!ok)return res.json({error:'كلمة السر خطأ ❌'});res.json({user,role:u.role,token:makeJWT(user,u.role)});
});

app.get('/api/posts',(req,res)=>res.json(posts));
app.post('/api/posts',(req,res)=>{let {user,text}=req.body;user=sanitize(user);text=sanitize(text);if(!user||!text)return res.json({error:'ناقص'});posts.unshift({user,text,time:Date.now(),id:Date.now()});save();io.emit('broadcast_post',posts);res.json({ok:true});});
app.get('/api/wallet/:user',(req,res)=>{let u=sanitize(req.params.user);if(!wallets[u])wallets[u]={balance:100,gifts:0,earned:0};res.json(wallets[u]);});
app.get('/api/ping',(req,res)=>res.json({ok:true,msg:'V31.2 WORLD SECURE 👑🌍',king:KING_USER,users:Object.keys(users).length,posts:posts.length,live:live.on,viewers:Object.keys(live.viewers).length,security:'helmet+bcrypt+jwt+rateLimit'}));

// === LIVE - جمهور حقيقي عالمي + أمانات منفصلة ===
io.on('connection',socket=>{
 socket.on('king_live_start',d=>{let u=sanitize(d.user);if(u!==KING_USER)return socket.emit('error_msg',{msg:'البث للملك فقط 👑'});live={on:true,owner:KING_USER,viewers:{},likes:0,gifts:0};io.emit('live_started',{user:KING_USER,time:Date.now()});});
 socket.on('join_live',d=>{if(!live.on)return;let u=sanitize(d.user);live.viewers[u]=Date.now();io.emit('viewers_update',{count:Object.keys(live.viewers).length,list:Object.keys(live.viewers)});});
 socket.on('leave_live',d=>{let u=sanitize(d.user);delete live.viewers[u];io.emit('viewers_update',{count:Object.keys(live.viewers).length});});
 socket.on('live_like',d=>{if(!live.on)return;live.likes++;io.emit('new_like',{user:sanitize(d.user),count:live.likes});});
 socket.on('live_comment',d=>{if(!live.on)return;io.emit('new_comment',{user:sanitize(d.user),text:sanitize(d.text)});});
 socket.on('live_gift',d=>{
  if(!live.on)return;let from=sanitize(d.from);let val=Math.abs(Number(d.value)||0);if(val<=0||val>1000)return;
  if(!wallets[from]||wallets[from].balance<val)return socket.emit('error_msg',{msg:'رصيدك لا يكفي'});
  wallets[from].balance-=val;wallets[live.owner].balance+=val;wallets[live.owner].gifts+=val;live.gifts+=val;save();
  io.emit('new_gift',{from,gift:sanitize(d.gift),value:val,total:live.gifts});
  io.emit('wallet_update',{user:from,balance:wallets[from].balance});
  io.emit('wallet_update',{user:live.owner,balance:wallets[live.owner].balance});
 });
 socket.on('end_live',d=>{let u=sanitize(d.user);if(u!==KING_USER)return;live={on:false,owner:null,viewers:{},likes:0,gifts:0};io.emit('live_ended');io.emit('viewers_update',{count:0});});
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
const PORT=process.env.PORT||10000;
server.listen(PORT,'0.0.0.0',()=>{console.log(`🏰 TARIM OS V31.2 WORLD SECURE on ${PORT} 👑🌍`);save();});
