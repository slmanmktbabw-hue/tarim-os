const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const fs=require('fs');
const helmet=require('helmet');
const rateLimit=require('express-rate-limit');
const cors=require('cors');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:["https://tarimos.org","https://www.tarimos.org","http://localhost:3000"]}});
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(cors({origin:["https://tarimos.org","https://www.tarimos.org","http://localhost:3000"]}));
app.use(rateLimit({windowMs:15*60*1000,max:300}));
app.use(express.json({limit:'10mb'}));
app.use(express.static(path.join(__dirname,'public')));
const JWT_SECRET='TARIM_OS_SOVEREIGN_2025_AL_KING_!@#';
const KING_USER='Gooaz@$&-#';
const KING_PASS_RAW='GG12345123rr@#$*';
let users={}; try{users=JSON.parse(fs.readFileSync('./users.json','utf8'))}catch(e){}
let posts=[]; try{posts=JSON.parse(fs.readFileSync('./posts.json','utf8'))}catch(e){}
let walletDB={}; try{walletDB=JSON.parse(fs.readFileSync('./wallet.json','utf8'))}catch(e){}
function saveUsers(){fs.writeFileSync('./users.json',JSON.stringify(users));}
function savePosts(){fs.writeFileSync('./posts.json',JSON.stringify(posts.slice(0,200)));}
function saveWallet(){fs.writeFileSync('./wallet.json',JSON.stringify(walletDB));}
(async()=>{if(!users[KING_USER]){const hash=await bcrypt.hash(KING_PASS_RAW,10); users[KING_USER]={pass:hash, role:'KING', created:Date.now()}; saveUsers(); console.log('👑 حساب الملك مشفر وجاهز');}})();
function clean(t){if(!t) return ""; return t.toString().replace(/</g,"&lt;").replace(/>/g,"&gt;").slice(0,500);}
app.post('/api/auth/register', async(req,res)=>{let {user, pass}=req.body; if(!user||!pass) return res.json({error:'اكمل البيانات'}); user=user.toString().trim().slice(0,30); if(user===KING_USER) return res.json({error:'هذا الاسم محجوز للقلعة 👑'}); if(users[user]) return res.json({error:'الحساب موجود - سجل دخول'}); if(pass.length<4) return res.json({error:'كلمة المرور قصيرة'}); const hash=await bcrypt.hash(pass,10); users[user]={pass:hash, role:'user', created:Date.now()}; saveUsers(); walletDB[user]={balance:100,earned:0}; saveWallet(); const token=jwt.sign({user,role:'user'},JWT_SECRET,{expiresIn:'30d'}); res.json({ok:true, token, user});});
app.post('/api/auth/login', async(req,res)=>{let {user, pass}=req.body; if(!user||!pass) return res.json({error:'اكمل البيانات'}); user=user.toString().trim(); const u=users[user]; if(!u) return res.json({error:'الحساب غير موجود'}); const ok=await bcrypt.compare(pass, u.pass); if(!ok) return res.json({error:'كلمة المرور خطأ'}); const token=jwt.sign({user,role:u.role},JWT_SECRET,{expiresIn:'30d'}); res.json({ok:true, token, user, role:u.role});});
app.get('/api/posts',(req,res)=>res.json(posts));
app.post('/api/posts',(req,res)=>{const p={...req.body, text:clean(req.body.text), user:clean(req.body.user).slice(0,30)}; if(!p.text) return res.json({error:'فارغ'}); posts.unshift(p); savePosts(); io.emit('broadcast_post',posts); res.json({ok:true});});
app.get('/api/wallet/:user',(req,res)=>{const u=clean(req.params.user)||'AL'; if(!walletDB[u]) walletDB[u]={balance:100,earned:0}; res.json(walletDB[u]);});
app.post('/api/support',(req,res)=>{res.json({reply:`🛡️ تم استلام رسالتك يا ${clean(req.body.user)} - تذكرة #${Date.now()}`});});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log('TARIM OS V23 KING SECURE on '+PORT));
