const express=require('express');const http=require('http');const {Server}=require('socket.io');const path=require('path');const fs=require('fs');const crypto=require('crypto');
const app=express();const server=http.createServer(app);const io=new Server(server,{cors:{origin:"*"}});
app.use(express.json({limit:'100mb'}));app.use(express.static(path.join(__dirname,'public')));
let posts=[];try{posts=JSON.parse(fs.readFileSync('./posts.json','utf8'))}catch(e){posts=[]}
let walletDB={};try{walletDB=JSON.parse(fs.readFileSync('./wallet.json','utf8'))}catch(e){walletDB={}}
let usersDB={};try{usersDB=JSON.parse(fs.readFileSync('./users.json','utf8'))}catch(e){usersDB={}}
const KING_USER="Gooaz@$&-#";const KING_PASS="GG12345123rr@#$*";const KING_PASS2="KING123";
usersDB[KING_USER]={pass:KING_PASS,role:"KING"};walletDB[KING_USER]=walletDB[KING_USER]||{balance:10000,gifts:0};
let live={active:false,owner:null,viewers:{},likes:0,gifts:0};
function save(){try{fs.writeFileSync('./posts.json',JSON.stringify(posts.slice(0,200)))}catch(e){}try{fs.writeFileSync('./wallet.json',JSON.stringify(walletDB))}catch(e){}try{fs.writeFileSync('./users.json',JSON.stringify(usersDB))}catch(e){}}
function token(u){return Buffer.from(u+':'+Date.now()).toString('base64');}
app.post('/api/auth/register',(req,res)=>{const{user,pass}=req.body;if(user===KING_USER)return res.json({error:'محمي 👑'});if(usersDB[user])return res.json({error:'موجود'});usersDB[user]={pass,role:'user'};walletDB[user]={balance:100,gifts:0};save();res.json({user,role:'user',token:token(user)});});
app.post('/api/auth/login',(req,res)=>{const{user,pass}=req.body;if(user===KING_USER){if(pass!==KING_PASS&&pass!==KING_PASS2)return res.json({error:'خطأ ❌'});return res.json({user,role:'KING',token:token(user)});}const u=usersDB[user];if(!u)return res.json({error:'غير موجود'});if(u.pass!==pass)return res.json({error:'خطأ'});res.json({user,role:u.role,token:token(user)});});
app.get('/api/posts',(req,res)=>res.json(posts));
app.post('/api/posts',(req,res)=>{posts.unshift({user:req.body.user,text:req.body.text,time:Date.now()});save();io.emit('broadcast_post',posts);res.json({ok:true});});
app.get('/api/wallet/:user',(req,res)=>{if(!walletDB[req.params.user])walletDB[req.params.user]={balance:100,gifts:0};res.json(walletDB[req.params.user]);});
app.get('/api/ping',(req,res)=>res.json({users:Object.keys(usersDB).length,posts:posts.length,live:live.active}));
io.on('connection',socket=>{
 socket.on('king_live_start',d=>{if(d.user!==KING_USER)return socket.emit('error_msg',{msg:'للمالك فقط'});live.active=true;live.owner=d.user;live.viewers={};live.likes=0;live.gifts=0;io.emit('live_started',d);});
 socket.on('join_live',d=>{if(!live.active)return;live.viewers[d.user]=Date.now();io.emit('viewers_update',{count:Object.keys(live.viewers).length});});
 socket.on('leave_live',d=>{delete live.viewers[d.user];io.emit('viewers_update',{count:Object.keys(live.viewers).length});});
 socket.on('live_like',d=>{if(!live.active)return;live.likes++;io.emit('new_like',{count:live.likes});});
 socket.on('live_comment',d=>{if(!live.active)return;io.emit('new_comment',d);});
 socket.on('live_gift',d=>{if(!live.active)return;if(!walletDB[live.owner])walletDB[live.owner]={balance:0,gifts:0};walletDB[live.owner].balance+=d.value;walletDB[live.owner].gifts+=d.value;live.gifts+=d.value;save();io.emit('new_gift',d);io.emit('wallet_update',{user:live.owner,balance:walletDB[live.owner].balance});});
 socket.on('end_live',d=>{if(live.owner!==d.user)return;live={active:false,owner:null,viewers:{},likes:0,gifts:0};io.emit('live_ended');});
});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
server.listen(process.env.PORT||10000,'0.0.0.0',()=>console.log('V30.1 REAL'));
