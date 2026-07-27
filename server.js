const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SOVEREIGNTY = {
  KING: 'AL',
  GREEN_LIGHT: true,
  LEVEL: '100% SOVEREIGN',
  WALLET: '0x53ce5e429ac48f355b775e418ded0b13931c0af6',
  DOMAIN: 'tarimos.org',
  CEO_AI: 'ACTIVE HYBRID'
};

let systemLogs = [];
let connectedUsers = 0;

function ceoLog(action, detail){
  const entry = { time: new Date().toISOString(), action, detail };
  systemLogs.unshift(entry);
  if(systemLogs.length > 100) systemLogs.pop();
  console.log(`👑 CEO AI [${action}]: ${detail}`);
  io.emit('ceo_log', entry);
}

async function processTarimAICore(prompt, userId='AL') {
  if(!SOVEREIGNTY.GREEN_LIGHT) return 'الضوء الأحمر - السيادة موقوفة';
  const p = prompt.toLowerCase();
  if (p.includes('اطرد') || p.includes('احظر')) {
    ceoLog('BAN_EXECUTED', prompt);
    io.emit('force_action', { type: 'ban', target: prompt });
    return `🛡️ تم التنفيذ بالضوء الأخضر: تم طرد الهدف بأمر المدير التنفيذي AI`;
  }
  if (p.includes('تقرير') || p.includes('status')) {
    return `📊 تقرير المدير التنفيذي AI:\n👥 المتصلون: ${connectedUsers}\n🏰 الحالة: ${SOVEREIGNTY.LEVEL}\n💰 المحفظة: نشطة ${SOVEREIGNTY.WALLET.slice(0,6)}... \n🟢 الضوء: ${SOVEREIGNTY.GREEN_LIGHT}`;
  }
  if (p.includes('محفظة') || p.includes('okx')) {
    return `✅ محفظة السيادة ${SOVEREIGNTY.WALLET} نشطة على ${SOVEREIGNTY.DOMAIN} 🔗💰`;
  }
  ceoLog('GPT_QUERY', prompt);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {role: "system", content: `انت المدير التنفيذي AI لقلعة ${SOVEREIGNTY.DOMAIN}. الملك هو ${SOVEREIGNTY.KING} من تريم حضرموت. رد بسيادة واختصار وبالعربي.`},
        {role: "user", content: prompt}
      ],
    });
    return completion.choices[0].message.content;
  } catch (e) {
    console.error(e);
    return "⚠️ خطأ اتصال بعقل GPT - تأكد من OPENAI_API_KEY في Render";
  }
}

app.get('/api/ceo/status', (req,res)=> res.json({...SOVEREIGNTY, connectedUsers, logs: systemLogs.slice(0,20) }));
app.post('/api/ceo/command', async (req,res)=>{
  const { command, key } = req.body;
  if(key!== 'AL-CEO-2025') return res.status(403).json({ error: 'غير مصرح' });
  const result = await processTarimAICore(command, 'CEO_PANEL');
  res.json({ result, sovereignty: SOVEREIGNTY });
});
app.get('/api/wallet', (req,res)=> res.json({ status: 'active', wallet: SOVEREIGNTY.WALLET, ceo: 'AI_SOVEREIGN' }));

io.on('connection', (socket)=>{
  connectedUsers++;
  ceoLog('CONNECT', `متصل جديد ${socket.id}`);
  socket.on('ai_prompt', async (data)=>{
    const aiResponse = await processTarimAICore(data.text || '', socket.id);
    io.emit('ai_response', { user: 'CEO AI', text: aiResponse });
  });
  socket.on('message', (data)=> io.emit('message', data));
  socket.on('disconnect', ()=>{ connectedUsers--; ceoLog('DISCONNECT', `غادر ${socket.id}`); });
});

app.get('*', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', ()=>{
  console.log(`🏰👑 القلعة الذكية v17 تعمل على ${PORT}`);
  ceoLog('STARTUP', `انطلقت بسيادة ${SOVEREIGNTY.LEVEL}`);
});
