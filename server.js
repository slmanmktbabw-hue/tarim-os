const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const fs=require('fs');
const helmet=require('helmet');
const rateLimit=require('express-rate-limit');
const cors=require('cors');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:["https://tarimos.org","https://www.tarimos.org","http://localhost:3000"]}});
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(cors({origin:["https://tarimos.org","https://www.tarimos.org","http://localhost:3000"]}));
app.use(rateLimit({windowMs:15*60*1000,max:200,message:{error:'كثرة طلبات'}}));
app.use(express.json({limit:'10mb'}));
app.use(express.static(path.join(__dirname,'public')));
let posts=[];try{posts=JSON.parse(fs.readFileSync('./posts.json','utf8'))}catch(e){posts=[]}
let walletDB={'AL':{balance:10000,earned:0}};try{walletDB=JSON.parse(fs.readFileSync('./wallet.json','utf8'))}catch(e){}
function savePosts(){try{fs.writeFileSync('./posts.json',JSON.stringify(posts.slice(0,200)))}catch(e){}}
function saveWallet(){try{fs.writeFileSync('./wallet.json',JSON.stringify(walletDB))}catch(e){}}
function clean(t){if(!t) return "";return t.toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/`/g,"&#x60;").slice(0,500);}
app.get('/api/posts',(req,res)=>res.json(posts));
app.post('/api/posts',(req,res)=>{const p={...req.body,text:clean(req.body.text),user:clean(req.body.user).slice(0,15)};if(!p.text) return res.json({error:'فارغ'});posts.unshift(p);savePosts();io.emit('broadcast_post',posts);res.json({ok:true});});
app.get('/api/wallet/:user',(req,res)=>{const u=clean(req.params.user)||'AL';if(!walletDB[u]) walletDB[u]={balance:100,earned:0};res.json(walletDB[u]);});
app.post('/api/wallet/gift',(req,res)=>{const {from,to,gift}=req.body;const f=clean(from),t=clean(to);const prices={'🎁':10,'❤️':5,'👑':50,'🚀':100};const price=prices[gift]||10;if(!walletDB[f]) walletDB[f]={balance:100,earned:0};if(!walletDB[t]) walletDB[t]={balance:100,earned:0};if(walletDB[f].balance<price) return res.json({error:'رصيد لا يكفي'});walletDB[f].balance-=price;walletDB[t].balance+=price*0.7;walletDB[t].earned+=price*0.7;saveWallet();io.emit('gift_received',{from:f,to:t,gift,price});res.json({yourBalance:walletDB[f].balance});});
app.post('/api/support',(req,res)=>{const user=clean(req.body.user);const msg=clean(req.body.text);console.log("دعم من "+user+": "+msg);res.json({reply:`🛡️ تم استلام رسالتك يا ${user} - تذكرة #${Date.now()}`});});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log('TARIM OS V22 SECURE on '+PORT));
