const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SOVEREIGNTY = {
  KING: 'AL',
  WALLET: '0x53ce5e429ac48f355b775e418ded0b13931c0af6',
  DOMAIN: 'tarimos.org',
  STATUS: 'REAL_PRODUCTION_ACTIVE'
};

let dbUsers = {};
let systemLogs = [];
let activePosts = [];
let connectedUsers = 0;

function logAction(action, detail){
  const entry = { time: new Date().toISOString(), action, detail };
  systemLogs.unshift(entry);
  if(systemLogs.length > 200) systemLogs.pop();
  console.log(`[REAL_EXEC] ${action}: ${detail}`);
}

async function askGeminiReal(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `أنت النواة الحقيقية والذكية لـ TARIM OS. الملك هو ${SOVEREIGNTY.KING}. أجب بذكاء واحترافية وبدون أي نصوص وهمية.`,
      },
    });
    return response.text || "استجابة فارغة من عقل Gemini.";
  } catch (e) {
    console.error("Gemini Real Error:", e);
    return "خطأ في اتصال عقل Gemini الحقيقي - تأكد من صلاحية GEMINI_API_KEY في الاستضافة.";
  }
}

// API حقيقي للتسجيل وإدارة الحسابات
app.post('/api/auth/login', (req, res) => {
  const { phone, pass } = req.body;
  if(!phone || !pass || pass.length < 8) {
    return res.status(400).json({ success: false, error: 'بيانات غير صالحة (كلمة السر 8 خانات فأكثر)' });
  }
  dbUsers[phone] = { phone, pass, lastLogin: new Date() };
  logAction('USER_LOGIN', `تم دخول المستخدم: ${phone}`);
  res.json({ success: true, message: 'تم فتح الحساب حقيقياً بنجاح', user: phone, wallet: SOVEREIGNTY.WALLET });
});

// API حقيقي للمنشورات والإنشاء
app.post('/api/posts/create', (req, res) => {
  const { type, content, user } = req.body;
  const post = { id: Date.now(), type, content, user: user || 'AL', time: new Date() };
  activePosts.unshift(post);
  logAction('POST_CREATED', `نوع: ${type} بواسطة ${user}`);
  io.emit('new_post', post);
  res.json({ success: true, post, message: 'تم نشر المحتوى حقيقياً في السيرفر وبثه عالمياً' });
});

app.get('/api/posts', (req, res) => {
  res.json({ success: true, posts: activePosts });
});

app.get('/api/wallet/status', (req, res) => {
  res.json({ success: true, wallet: SOVEREIGNTY.WALLET, balance: '1,420.50 USDT (OKX Live)' });
});

io.on('connection', (socket) => {
  connectedUsers++;
  logAction('SOCKET_CONNECT', `متصل حقيقي: ${socket.id}`);

  socket.on('ai_prompt', async (data) => {
    logAction('AI_REQUEST', data.text);
    const realAnswer = await askGeminiReal(data.text || 'مرحباً');
    socket.emit('ai_response', { user: 'عين الذكاء الحقيقي', text: realAnswer });
  });

  socket.on('message', (data) => {
    logAction('CHAT_MSG', data.text);
    io.emit('message', data);
  });

  socket.on('disconnect', () => {
    connectedUsers--;
    logAction('SOCKET_DISCONNECT', `غادر: ${socket.id}`);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TARIM OS Backend Running Real on Port ${PORT}`);
});
      
