const express=require('express');const http=require('http');const {Server}=require('socket.io');const path=require('path');const fs=require('fs');const bcrypt=require('bcryptjs');const jwt=require('jsonwebtoken');const helmet=require('helmet');const cors=require('cors');const rateLimit=require('express-rate-limit');
const app=express();const server=http.createServer(app);const io=new Server(server,{cors:{origin:"*"}});
const JWT_SECRET="TARIM_OS_KING_2026_FIXED_V31_3"; // ثابت - ما يتغير
const KING_USER="Gooaz@$&-#";const KING_ALIASES=["Gooaz@$&-#","#-&$@Gooaz","Gooaz","AL"];const KING_PASS="GG12345123rr@#$*";
app.use(helmet({contentSecurityPolicy:false}));app.use(cors({origin:"*"}));app.use(express.json({limit:'10mb'}));app.use(express.static(path.join(__dirname,'public')));
const limiter=rateLimit({windowMs:60*1000,max:120});app.use('/api/',limiter);
const authLimiter=rateLimit({windowMs:15*60*1000,max:30});
let posts=[];try{posts=JSON.parse(fs.readFileSync('./posts.json','utf8'))}catch(e){}
let wallets={};try{wallets=JSON.parse(fs.readFileSync('./wallet.json','utf8'))}catch(e){}
let users={};try{users=JSON.parse(fs.readFileSync('./users.json','utf8'))}catch(e){}
if(!users[KING_USER]) users[KING_USER]={pass:bcrypt.hashSync(KING_PASS,10),role:'KING',created:Date.now()};
if(!wallets[KING_USER]) wallets[KING_USER]={balance:10000,gifts:0,earned:0};
function save(){try{fs.writeFileSync('./posts.json',JSON.stringify(posts.slice(0,500)))}catch(e){}try{fs.writeFileSync('./wallet.json',JSON.stringify(wallets))}catch(e){}try{fs.writeFileSync('./users.json',JSON.stringify(users))}catch(e){}}
function sanitize(t){return String(t||'').slice(0,500).replace(/[<>]/g,'');}
function makeJWT(u,r){return jwt.sign({user:u,role:r},JWT_SECRET,{expiresIn:'7d'});}
function isKing(u){return KING_ALIASES.includes(u.trim());}
app.post('/api/auth/register',authLimiter,(req,res)=>{let {user,pass}=req.body;user=sanitize(user).trim();if(!user||user.length<3)return res.json({error:'3 أحرف'});if(isKing(user))return res.json({error:'حساب الملك محمي 👑'});if(users[user])return res.json({error:'الاسم موجود'});users[user]={pass:bcrypt.hashSync(pass,10),role:'user',created:Date.now()};wallets[user]={balance:100,gifts:0};save();res.json({user,role:'user',token:makeJWT(user,'user')});});
app.post('/api/auth/login',authLimiter,(req,res)=>{let {user,pass}=req.body;if(!user||!pass)return res.json({error:'اكمل'});user=user.trim();pass=pass.trim();if(isKing(user)){if(pass!==KING_PASS&&pass!=="KING123"&&pass!=="king123"&&pass!=="GG12345123rr")return res.json({error:'كلمة سر الملك خطأ ❌'});if(!users[KING_USER])users[KING_USER]={pass:bcrypt.hashSync(KING_PASS,10),role:'KING'};save();return res.json({user:KING_USER,role:'KING',token:makeJWT(KING_USER,'KING')});}const u=users[user];if(!u)return res.json({error:'غير موجود'});if(!bcrypt.compareSync(pass,u.pass))return res.json({error:'كلمة السر خطأ'});res.json({user,role:u.role,token:makeJWT(user,u.role)});});
app.get('/api/posts',(req,res)=>res.json(posts));
app.post('/api/posts',(req,res)=>{let {user,text}=req.body;user=sanitize(user);text=sanitize(text);if(!user||!text)return res.json({error:'ناقص'});posts.unshift({user,text,time:Date.now(),id:Date.now()});save();io.emit('broadcast_post',posts);res.json({ok:true});});
app.get('/api/wallet/:user',(req,res)=>{let u=sanitize(req.params.user);if(!wallets[u])wallets[u]={balance:100,gifts:0};res.json(wallets[u]);});
app.get('/api/ping',(req,res)=>res.json({ok:true,v:'31.3',users:Object.keys(users).length,posts:posts.length}));
let live={on:false,owner:null,viewers:{},likes:0,gifts:0};
io.on('connection',socket=>{
 socket.on('king_live_start',d=>{if(!isKing(sanitize(d.user)))return;live={on:true,owner:KING_USER,viewers:{},likes:0,gifts:0};io.emit('live_started',{user:KING_USER});});
 socket.on('join_live',d=>{if(!live.on)return;live.viewers[sanitize(d.user)]=Date.now();io.emit('viewers_update',{count:Object.keys(live.viewers).length});});
 socket.on('leave_live',d=>{delete live.viewers[sanitize(d.user)];io.emit('viewers_update',{count:Object.keys(live.viewers).length});});
 socket.on('live_like',d=>{if(!live.on)return;live.likes++;io.emit('new_like',{count:live.likes});});
 socket.on('live_comment',d=>{if(!live.on)return;io.emit('new_comment',{user:sanitize(d.user),text:sanitize(d.text)});});
 socket.on('live_gift',d=>{if(!live.on)return;let from=sanitize(d.from);let val=Number(d.value)||0;if(!wallets[from]||wallets[from].balance<val)return;wallets[from].balance-=val;wallets[KING_USER].balance+=val;wallets[KING_USER].gifts+=val;live.gifts+=val;save();io.emit('new_gift',{from,gift:sanitize(d.gift),value:val});io.emit('wallet_update',{user:from,balance:wallets[from].balance});io.emit('wallet_update',{user:KING_USER,balance:wallets[KING_USER].balance});});
 socket.on('end_live',d=>{if(!isKing(sanitize(d.user)))return;live={on:false,owner:null,viewers:{},likes:0,gifts:0};io.emit('live_ended');});
});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
server.listen(process.env.PORT||10000,'0.0.0.0',()=>{console.log('🏰 V31.3 LIVE 👑');save();});
