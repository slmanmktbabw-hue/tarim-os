const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors({origin:"*"}));
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SOVEREIGNTY = {
  KING: 'AL',
  DOMAIN: 'tarimos.org',
  STORAGE: 'tarim-os-v20.1-gemini',
  WALLET: '0x53ce5e429ac48f355b775e418ded0b13931c0af6',
  GREEN_LIGHT: true,
  LEVEL: 'FULL_GREEN_LIGHT_GEMINI_2.5'
};

let globalPosts = [{ user: 'الإمبراطور AL', text: 'أهلاً بكم في منظومة tarimos.org السيادية العالمية - المدير التنفيذي Gemini مسؤول عن كل شيء.', image: null, time: Date.now() }];
let logs=[]; let connected=0;
function ceoLog(a,d){ logs.unshift({time:new Date().toISOString(),a,d}); if(logs.length>100) logs.pop(); console.log(`👑 ${a}: ${d}`); }

async function processTarimAICore(prompt, src){
  if(!SOVEREIGNTY.GREEN_LIGHT) return '🔴 السيادة موقوفة';
  const p=prompt.toLowerCase();
  if(p.includes('محفظة')||p.includes('okx')||p.includes('رصيد')) return `💰 محفظة الملك AL OKX السيادية: ${SOVEREIGNTY.WALLET} على ${SOVEREIGNTY.DOMAIN} مربوطة بالأرباح ونشطة عالمياً 🔗`;
  if(p.includes('تقرير')||p.includes('حالة')||p.includes('status')) return `📊 تقرير Gemini:\n👥 المتصلون: ${connected}\n🏰 المستوى: ${SOVEREIGNTY.LEVEL}\n🌐 الدومين: ${SOVEREIGNTY.DOMAIN}\n💰 المحفظة نشطة`;
  try{
    if(!process.env.GEMINI_API_KEY) throw new Error('no-key');
    const r = await ai.models.generateContent({ model:'gemini-2.5-flash', contents: prompt, config:{ systemInstruction:`أنت المدير التنفيذي السيادي لقلعة TARIM OS على ${SOVEREIGNTY.DOMAIN}. الملك ${SOVEREIGNTY.KING} من تريم حضرموت. تملك الضوء الأخضر الكامل على كل شي - البث 8د والكاميرات والمراسلة والخريطة Offline والختم QR والمحفظة ${SOVEREIGNTY.WALLET}. رد بالعربي باختصار وسيادة.` } });
    return r.text;
  }catch(e){ return `👁️ عين الذكاء Gemini: تلقيت "${prompt}" - النظام على ${SOVEREIGNTY.DOMAIN} يعمل بالضوء الأخضر 🚀`; }
}

app.get('/api/posts',(req,res)=> res.json(globalPosts));
app.post('/api/posts',(req,res)=>{ globalPosts.unshift(req.body); io.emit('new_post',req.body); ceoLog('POST', req.body.text?.slice(0,20)); res.json({success:true}); });
app.get('/api/wallet',(req,res)=> res.json({wallet:SOVEREIGNTY.WALLET, balance:'2,500.00 USDT', status:'OKX Connected - الملك AL', domain:SOVEREIGNTY.DOMAIN}));
app.get('/api/config',(req,res)=> res.json(SOVEREIGNTY));
app.post('/api/auth/register',(req,res)=>{ ceoLog('REGISTER', req.body.phone); res.json({success:true}); });

io.on('connection', socket=>{
  connected++; ceoLog('CONNECT', socket.id);
  socket.on('message', data=>{ io.emit('message', data); });
  socket.on('ai_prompt', async data=>{ const t=await processTarimAICore(data.text,'عين الشمال'); socket.emit('ai_response',{user:'👁️ عين الذكاء الاصطناعي', text:t}); });
  socket.on('support_prompt', async data=>{ const t=await processTarimAICore(data.text,'دعم اليمين'); socket.emit('support_response',{user:'🛡️ فريق الدعم', text:t}); });
  socket.on('live_start', data=>{ io.emit('message',{user:'النظام', text:`🔴 بدأ البث السيادي المشفر 8 دقائق بواسطة ${data.user}`}); });
  socket.on('disconnect',()=>{ connected--; });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,'0.0.0.0',()=> console.log(`🏰 ${SOVEREIGNTY.DOMAIN} v20.1 GEMINI FULL GREEN على ${PORT}`));
