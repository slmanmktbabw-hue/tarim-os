const express=require('express');const http=require('http');const {Server}=require('socket.io');const path=require('path');const fs=require('fs');const crypto=require('crypto');const bcrypt=require('bcryptjs');
const app=express();const server=http.createServer(app);const io=new Server(server,{cors:{origin:"*"}});
app.use(express.json({limit:'20mb'}));app.use(express.static(path.join(__dirname,'public')));

let posts=[];try{posts=JSON.parse(fs.readFileSync('./posts.json','utf8'))}catch(e){}
let wallets={};try{wallets=JSON.parse(fs.readFileSync('./wallet.json','utf8'))}catch(e){}
let users={};try{users=JSON.parse(fs.readFileSync('./users.json','utf8'))}catch(e){}

const KING="Gooaz@$&-#"; const KINGPASS="GG12345123rr@#$*";
if(!users[KING]) users[KING]={pass:bcrypt.hashSync(KINGPASS,10),role:'KING'};
if(!wallets[KING]) wallets[KING]={balance:10000,gifts:0,earned:0};
let live={on:false,owner:null,viewers:{},likes:0,gifts:0};

function save(){fs.writeFileSync('./posts.json',JSON.stringify(posts.slice(0,500)));fs.writeFileSync('./wallet.json',JSON.stringify(wallets));fs.writeFileSync('./users.json',JSON.stringify(users));}
function sanitize(t){return String(t).slice(0,500).replace(/</g,'&lt;');}

app.post('/api/auth/register',(req,res)=>{
 let {user,pass}=req.body;user=sanitize(user);if(!user||!pass||user.length<3)return res.json({error:'الاسم 3 أحرف'});if(user===KING)return res.json({error:'محمي 👑'});if(users[user])return res.json({error:'موجود'});users[user]={pass:bcrypt.hashSync(pass,10),role:'user'};wallets[user]={balance:100,gifts:0,earned:0};save();res.json({user,role:'user',token:crypto.randomBytes(16).toString('hex')});
});
app.post('/api/auth/login',(req,res)=>{
 let {user,pass}=req.body;user=sanitize(user);const u=users[user];if(!u)return res.json({error:'غير موجود'});if(!bcrypt.compareSync(pass,u.pass))return res.json({error:'كلمة السر خطأ'});res.json({user,role:u.role,token:crypto.randomBytes(16).toString('hex')});
});
app.get('/api/posts',(req,res)=>res.json(posts));
app.post('/api/posts',(req,res)=>{let {user,text}=req.body;if(!user||!text)return res.json({error:'ناقص'});posts.unshift({user:sanitize(user),text:sanitize(text),time:Date.now(),id:Date.now()});save();io.emit('broadcast_post',posts);res.json({ok:true});});
app.get('/api/wallet/:user',(req,res)=>{let u=sanitize(req.params.user);if(!wallets[u])wallets[u]={balance:100,gifts:0};res.json(wallets[u]);});
app.get('/api/ping',(req,res)=>res.json({ok:true,users:Object.keys(users).length,posts:posts.length,live:live.on,viewers:Object.keys(live.viewers).length}));

// LIVE WORLD - جمهور حقيقي عالمي
io.on('connection',socket=>{
 socket.on('king_live_start',d=>{if(d.user!==KING)return;live.on=true;live.owner=KING;live.viewers={};live.likes=0;live.gifts=0;io.emit('live_started',{user:KING,time:Date.now()});});
 socket.on('join_live',d=>{if(!live.on)return;live.viewers[d.user]=Date.now();io.emit('viewers_update',{count:Object.keys(live.viewers).length,list:live.viewers});});
 socket.on('live_like',d=>{if(!live.on)return;live.likes++;io.emit('new_like',{user:d.user,count:live.likes});});
 socket.on('live_comment',d=>{if(!live.on)return;io.emit('new_comment',{user:sanitize(d.user),text:sanitize(d.text)});});
 socket.on('live_gift',d=>{if(!live.on)return;let from=sanitize(d.from);let val=Number(d.value)||0;if(val>wallets[from]?.balance)return;wallets[from].balance-=val;wallets[live.owner].balance+=val;wallets[live.owner].gifts+=val;live.gifts+=val;save();io.emit('new_gift',{from,gift:d.gift,value:val,total:live.gifts});io.emit('wallet_update',{user:live.owner,balance:wallets[live.owner].balance});io.emit('wallet_update',{user:from,balance:wallets[from].balance});});
 socket.on('end_live',d=>{if(d.user!==KING)return;live={on:false,owner:null,viewers:{},likes:0,gifts:0};io.emit('live_ended');});
});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
server.listen(process.env.PORT||10000,'0.0.0.0',()=>console.log('V31 WORLD SECURE'));
