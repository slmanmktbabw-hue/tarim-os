const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 🔥 السطر السيادي الذي يخدم الواجهة - يخلي Render يعرض موقعك
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const CEO_PASSWORD = process.env.CEO_PASSWORD || 'Tarim2026!Sovereign';

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS system_logs (
                id SERIAL PRIMARY KEY,
                action VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("[+] TARIM OS v8.4 SECURE Database Initialized.");
    } catch (err) {
        console.error("[-] DB Error:", err);
    }
}
initDB();

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TARIM OS v8.4 Fusion Supreme</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background-color: #0b0f19; color: #fff; font-family: system-ui, sans-serif; }
      .glass-card { background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(15px); border: 1px solid rgba(0, 243, 255, 0.2); }
      .neon-glow { box-shadow: 0 0 25px rgba(0, 243, 255, 0.35); }
      .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #00f3ff; color: #000; padding: 12px 26px; border-radius: 9999px; font-weight: bold; z-index: 1000; display: none; }
    </style>
</head>
<body class="pb-28">
    <div id="authModal" class="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 rounded-3xl w-full max-w-sm text-center neon-glow border border-cyan-500/40">
            <div class="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl border border-cyan-500">
                <i class="fa-solid fa-fingerprint animate-pulse"></i>
            </div>
            <h2 class="text-xl font-black text-cyan-400 mb-1">TARIM OS v8.4</h2>
            <p class="text-xs text-gray-400 mb-4">أدخل كلمة سر الـ CEO أو أنشئ حسابك السيادي الجديد</p>
            <input type="password" id="ceoPassword" placeholder="كلمة السر السيادية (CEO)" class="w-full bg-gray-900 border border-cyan-500/50 rounded-xl px-4 py-2.5 text-center text-white mb-3 focus:outline-none text-sm">
            <button onclick="verifyCEO()" class="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold py-2.5 rounded-xl shadow-lg mb-3 text-sm">دخول بصمة الـ CEO</button>
            <div class="border-t border-gray-800 my-3 pt-3">
                <input type="text" id="regUsername" placeholder="اسم المستخدم الجديد" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-center text-white mb-2 text-xs">
                <input type="email" id="regEmail" placeholder="البريد الإلكتروني" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-center text-white mb-2 text-xs">
                <input type="password" id="regPassword" placeholder="كلمة المرور للحساب" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-center text-white mb-3 text-xs">
                <button onclick="registerUser()" class="w-full bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-cyan-500/30 font-bold py-2 rounded-xl text-xs mb-2">إنشاء حساب جديد (Sign Up)</button>
            </div>
            <button onclick="triggerSOS()" class="w-full bg-red-600/20 text-red-400 border border-red-500/50 py-2 rounded-xl text-xs font-bold mt-2"><i class="fa-solid fa-triangle-exclamation ml-1"></i> زر الطوارئ SOS</button>
        </div>
    </div>
    <header class="flex justify-between items-center px-4 py-3 glass-card border-b border-gray-800">
        <div class="flex items-center space-x-3 space-x-reverse">
            <button onclick="showToast('🔔 التنبيهات السيادية مفعلة')" class="text-yellow-400 text-xl"><i class="fa-solid fa-bell"></i></button>
            <button onclick="showToast('🔍 عين الذكاء الاصطناعي تبحث')" class="text-gray-300 text-lg ml-3"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
        <div class="flex items-center space-x-1 space-x-reverse bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/40">
            <i class="fa-solid fa-robot text-cyan-400 text-xs"></i>
            <span class="text-xs text-cyan-200">فريق الدعم</span>
        </div>
        <div class="flex items-center space-x-2 space-x-reverse">
            <span class="font-bold text-lg tracking-wider text-cyan-400">TARIM OS</span>
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-ping"></span>
        </div>
    </header>
    <main class="p-4 space-y-4">
        <div class="relative rounded-2xl overflow-hidden glass-card shadow-2xl h-60 border border-gray-800">
            <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop" class="w-full h-full object-cover opacity-80" alt="Stream">
            <div class="absolute top-3 left-3 flex items-center space-x-2 space-x-reverse">
                <button onclick="showToast('➕ تم إضافة عقدة بث جديدة')" class="bg-black/50 p-2 rounded-full text-white backdrop-blur-md"><i class="fa-solid fa-plus"></i></button>
                <div class="bg-black/50 px-3 py-1 rounded-full text-xs flex items-center space-x-1 space-x-reverse backdrop-blur-md">
                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span>24.3K</span>
                </div>
            </div>
            <div class="absolute top-3 right-3 flex space-x-2 space-x-reverse">
                <span class="bg-gray-800/80 text-xs px-3 py-1 rounded-full text-gray-200 backdrop-blur-md">بث مباشر سيادي مفعل</span>
                <span class="bg-red-600 text-xs px-3 py-1 rounded-full font-bold">مباشر</span>
            </div>
            <div class="absolute right-3 bottom-10 flex flex-col items-center space-y-3">
                <button onclick="showToast('❤️ تم إرسال إعجاب سيادي')" class="flex flex-col items-center text-red-500"><div class="bg-black/40 p-3 rounded-full backdrop-blur-md"><i class="fa-solid fa-heart text-xl"></i></div><span class="text-xs text-white font-bold">12.8K</span></button>
                <button onclick="showToast('🎁 تم إرسال هدية بث سيادية')" class="flex flex-col items-center text-yellow-400"><div class="bg-black/40 p-3 rounded-full backdrop-blur-md"><i class="fa-solid fa-gift text-xl"></i></div><span class="text-xs text-white font-bold">3.2K</span></button>
                <button onclick="showToast('💬 المحادثات المشفرة')" class="flex flex-col items-center text-white"><div class="bg-black/40 p-3 rounded-full backdrop-blur-md"><i class="fa-solid fa-comment-dots text-xl"></i></div><span class="text-xs text-white font-bold">892</span></button>
                <button onclick="showToast('↗️ تم نسخ رابط البث')" class="flex flex-col items-center text-white"><div class="bg-black/40 p-3 rounded-full backdrop-blur-md"><i class="fa-solid fa-share text-xl"></i></div><span class="text-xs text-white font-bold">412</span></button>
            </div>
        <section class="mt-4">
            <div class="flex justify-between items-center mb-3">
                <span class="text-xs text-cyan-400 font-bold"><i class="fa-solid fa-database ml-1"></i> PostgreSQL دائمة ومشفرة</span>
                <h2 class="text-lg font-bold text-white">قائمة المهام والعمليات السيادية</h2>
            </div>
            <div class="space-y-3">
                <div class="glass-card p-4 rounded-2xl border-l-4 border-cyan-500 flex items-center justify-between">
                    <div class="flex items-center space-x-3 space-x-reverse"><input type="checkbox" checked class="w-5 h-5 accent-cyan-400"><div><h3 class="font-bold text-sm text-white">بث مباشر سيادي ومشفر</h3><p class="text-xs text-gray-400">سيرفرات أسطورية • هدايا</p></div></div><span class="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">بث نشط</span>
                </div>
                <div class="glass-card p-4 rounded-2xl border-l-4 border-blue-500 flex items-center justify-between">
                    <div class="flex items-center space-x-3 space-x-reverse"><input type="checkbox" checked class="w-5 h-5 accent-cyan-400"><div><h3 class="font-bold text-sm text-white">المراسلة الآمنة بين الحسابات</h3><p class="text-xs text-gray-400">ذكاء اصطناعي • موثق</p></div></div><span class="text-xs px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-700">محمي</span>
                </div>
            </div>
        </section>
    </main>
    <nav class="fixed bottom-0 left-0 right-0 glass-card border-t border-gray-800 flex justify-around items-center py-3 px-2 z-40">
        <button onclick="showToast('📂 الملف الشخصي')" class="flex flex-col items-center text-gray-400"><i class="fa-solid fa-user text-lg"></i><span class="text-[10px] mt-1">الملف</span></button>
        <button onclick="showToast('💬 المحادثات')" class="flex flex-col items-center text-gray-400"><i class="fa-solid fa-comment text-lg"></i><span class="text-[10px] mt-1">المحادثات</span></button>
        <button onclick="showToast('🤖 الذكاء الاصطناعي')" class="flex flex-col items-center text-cyan-400"><i class="fa-solid fa-robot text-lg"></i><span class="text-[10px] mt-1">الذكاء</span></button>
        <button onclick="showToast('📋 المهام')" class="flex flex-col items-center text-gray-400"><i class="fa-solid fa-bars-staggered text-lg"></i><span class="text-[10px] mt-1">المهام</span></button>
        <button onclick="showToast('▶️ البث المباشر')" class="flex flex-col items-center text-yellow-500"><i class="fa-solid fa-play text-lg"></i><span class="text-[10px] mt-1">البث</span></button>
        <button onclick="showToast('⚡ تنفيذ أمر سيادي')" class="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-black shadow-lg border-4 border-[#0b0f19]"><i class="fa-solid fa-plus text-2xl"></i></button>
    </nav>
    <div id="toastMessage" class="toast">تم التنفيذ</div>
    <script>
        const API_URL = window.location.origin;
        function showToast(msg) {
            const t = document.getElementById('toastMessage');
            t.innerText = msg; t.style.display = 'block';
            setTimeout(() => t.style.display = 'none', 2500);
        }
        async function verifyCEO() {
            const pass = document.getElementById('ceoPassword').value;
            const res = await fetch(API_URL + '/api/verify-ceo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass }) });
            const data = await res.json();
            if(res.ok) { document.getElementById('authModal').style.display = 'none'; showToast('🛡️ أهلاً بك أيها الإمبراطور CEO'); }
            else showToast('❌ ' + data.error);
        }
        async function registerUser() {
            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            if(!username ||!email ||!password) { showToast('⚠️ أدخل كافة البيانات!'); return; }
            const response = await fetch(API_URL + '/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
            const data = await response.json();
            if(response.ok) { showToast('✅ ' + data.message); document.getElementById('authModal').style.display = 'none'; }
            else showToast('❌ ' + data.error);
        }
        function triggerSOS() {
            if(confirm('⚠️ هل أنت متأكد من تفعيل بروتوكول SOS؟')) {
                document.body.innerHTML = '<div style="background:black; color:red; height:100vh; display:flex; justify-content:center; align-items:center; font-size:24px; font-weight:bold;">تم قفل النظام أمنياً.</div>';
            }
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(HTML_TEMPLATE);
});

app.get('/api/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: "ONLINE & SECURE", sovereign: "TARIM OS v8.4", db_time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ status: "DB_ERROR", error: err.message });
    }
});

app.post('/api/verify-ceo', async (req, res) => {
    const { password } = req.body;
    if (password === CEO_PASSWORD) res.json({ success: true });
    else res.status(401).json({ error: "كلمة السر السيادية غير صحيحة!" });
});

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username ||!email ||!password) return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    try {
        const hash = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hash]
        );
        await pool.query('INSERT INTO system_logs (action) VALUES ($1)', [`New Sovereign User: ${username}`]);
        res.json({ message: "تم إنشاء الحساب السيادي المشفر بنجاح!", user: newUser.rows[0] });
    } catch (err) {
        if (err.code === '23505') res.status(400).json({ error: "البريد أو اسم المستخدم مستخدم مسبقاً." });
        else res.status(500).json({ error: "خطأ في السيرفر: " + err.message });
    }
});

io.on('connection', (socket) => {
    console.log(`[+] Secure Node Connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`[-] Node Disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`[+] TARIM OS v8.4 Sovereign running on port ${PORT}`));
