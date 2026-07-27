const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SOVEREIGNTY = {
  KING: 'AL',
  DOMAIN: 'tarimos.org',
  STORAGE: 'tarimos.org-v20.1-offline-cache',
  HOSTING: 'RENDER_GLOBAL_0.0.0.0',
  WALLET: '0x53ce5e429ac48f355b775e418ded0b13931c0af6',
  GREEN_LIGHT: true,
  LEVEL: 'FULL_GREEN_LIGHT_100%_GEMINI',
  CEO: 'processTarimAICore - مسؤول عن كل شي'
};

let connected=0, posts=[], users={}, logs=[], chats=[];

function ceoLog(a,d){ logs.unshift({time:new Date().toISOString(), action:a, detail:d}); if(logs.length>150) logs.pop(); io.emit('ceo_log',{a,d}); console.log(`👑 ${a}: ${d}`); }

async function processTarimAICore(prompt, src='USER'){
  if(!SOVEREIGNTY.GREEN_LIGHT) return '🔴 السيادة موقوفة';
  const p=prompt.toLowerCase();
  if(p.includes('محفظة')||p.includes('okx')||p.includes('رصيد')) return `💰 المدير التنفيذي Gemini: محفظة الملك AL السيادية ${SOVEREIGNTY.WALLET} في OKX مربوطة بأرباح التطبيق على ${SOVEREIGNTY.DOMAIN} ونشطة عالمياً 🔗`;
  if(p.includes('اطرد')||p.includes('احظر')||p.includes('ban')){ ceoLog('BAN',prompt); io.emit('force_ban',prompt); return '🛡️ الضوء الأخضر الكامل: تم الطرد السيادي بنجاح'; }
  if(p.includes('تقرير')||p.includes('status')||p.includes('حالة')) return `📊 تقرير المدير التنفيذي العالمي Gemini:\n👥 المتصلون: ${connected}\n🏰 الدومين: ${SOVEREIGNTY.DOMAIN}\n💾 التخزين: ${SOVEREIGNTY.STORAGE}\n💰 المحفظة: نشطة\n🟢 المستوى: ${SOVEREIGNTY.LEVEL}\n🌍 يعمل في جميع دول العالم`;
  ceoLog('GEMINI_QUERY', src+': '+prompt);
  try{
    if(!process.env.GEMINI_API_KEY) throw new Error('no-key');
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: `أنت المدير التنفيذي العام لقلعة TARIM OS على ${SOVEREIGNTY.DOMAIN}. الملك هو ${SOVEREIGNTY.KING} من تريم حضرموت. تملك الصلاحية الكاملة والضوء الأخضر المطلق على البث 8 دقائق والكاميرات والمراسلة والخريطة Offline والختم QR والمحفظة ${SOVEREIGNTY.WALLET}. رد بالعربي بسيادة واختصار.` }
    });
    return res.text;
  }catch(e){
    return `👁️ عين الذكاء Gemini: استقبلت "${prompt}" - القلعة على ${SOVEREIGNTY.DOMAIN} تنفذ بالضوء الأخضر 🚀`;
  }
}

app.get('/api/config',(req,res)=> res.json(SOVEREIGNTY));
app.get('/api/wallet',(req,res)=> res.json({ok:true, wallet:SOVEREIGNTY.WALLET, domain:SOVEREIGNTY.DOMAIN, status:'active'}));
app.get('/api/ceo/status',(req,res)=> res.json({...SOVEREIGNTY, connected, logs:logs.slice(0,20)}));
app.post('/api/auth/register',(req,res)=>{ users[req.body.phone]=req.body; ceoLog('REGISTER',req.body.phone); res.json({ok:true}); });
app.post('/api/posts',(req,res)=>{ const p={...req.body, id:Date.now()}; posts.unshift(p); io.emit('new_post',p); res.json({ok:true}); });
app.get('/api/posts',(req,res)=> res.json(posts));
app.get('/api/map/hadramout',(req,res)=> res.json({region:'تريم - حضرموت', offline:true, center:[16.0,49.0]}));

io.on('connection', socket=>{
  connected++; ceoLog('CONNECT', socket.id);
  socket.on('ai_prompt', async d=>{ const r=await processTarimAICore(d.text,'عين الذكاء-الشمال'); socket.emit('ai_response',{user:'👁️ عين الذكاء', text:r}); });
  socket.on('support_prompt', async d=>{ const r=await processTarimAICore(d.text,'فريق الدعم-اليمين'); socket.emit('support_response',{user:'🤖 فريق الدعم AI', text:r}); });
  socket.on('message', d=>{ chats.push(d); io.emit('message',d); });
  socket.on('live_start', d=>{ io.emit('live_broadcast',d); ceoLog('LIVE_8MIN', d.user); });
  socket.on('disconnect',()=>{ connected--; });
});

app.get('*',(req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
const PORT=process.env.PORT||3000;
server.listen(PORT,'0.0.0.0',()=> console.log(`🏰 ${SOVEREIGNTY.DOMAIN} v20.1 GEMINI FULL GREEN على ${PORT}`));
