const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

let pool;
let isMemoryMode =!process.env.DATABASE_URL;

if (!isMemoryMode) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
}

let memoryTasks = [
    { id: 1, title: 'بث مباشر سيادي ومشفر (8 دقائق)', description: 'سيرفرات أسطورية • إرسال واستقبال هدايا', status: 'بث نشط', completed: true },
    { id: 2, title: 'المراسلة والاتصال الآمن بين الحسابات', description: 'دعم بالذكاء الاصطناعي • حسابات موثقة', status: 'محمي', completed: true },
    { id: 3, title: 'خريطة حضرموت وتريم بدون نت (Offline)', description: 'تسجيل صوتي AES • مشاركة سيادية', status: 'ميداني', completed: true },
    { id: 4, title: 'إصدار الختم الميداني المشفر + QR', description: 'عين الذكاء الاصطناعي Tesseract OCR', status: 'جاهز', completed: false }
];

// إنشاء الجداول وتعبئة البيانات التلقائية
async function initDB() {
    if (isMemoryMode) return console.log("⚠️ MEMORY Mode - No DB seeding");
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL,
                description TEXT, status VARCHAR(50) DEFAULT 'فعالة',
                completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        const count = await pool.query('SELECT COUNT(*) FROM tasks');
        if (parseInt(count.rows[0].count) === 0) {
            await pool.query(`INSERT INTO tasks (title, description, status, completed) VALUES
            ('بث مباشر سيادي ومشفر (8 دقائق)', 'سيرفرات أسطورية • إرسال واستقبال هدايا', 'بث نشط', true),
            ('المراسلة والاتصال الآمن بين الحسابات', 'دعم بالذكاء الاصطناعي • حسابات موثقة', 'محمي', true),
            ('خريطة حضرموت وتريم بدون نت (Offline)', 'تسجيل صوتي AES • مشاركة سيادية', 'ميداني', true),
            ('إصدار الختم الميداني المشفر + QR', 'عين الذكاء الاصطناعي Tesseract', 'جاهز', false)
            `);
            console.log("[+] Tasks seeded successfully");
        }
    } catch (e) { console.error("DB Error:", e.message); isMemoryMode = true; }
}
initDB();

const CEO_PASSWORD = process.env.CEO_PASSWORD || 'Tarim2026!Sovereign';

app.get('/api/tasks', async (req, res) => {
    if (isMemoryMode) return res.json(memoryTasks);
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
        res.json(result.rows);
    } catch { res.json(memoryTasks); }
});

app.post('/api/verify-ceo', (req, res) => {
    const { password } = req.body;
    // تم إغلاق ثغرة 1234 و 2026
    if (password === CEO_PASSWORD) {
        res.json({ success: true, message: "تم التحقق بنجاح من صلاحيات الملك والـ CEO." });
    } else {
        res.status(401).json({ error: "رمز الحماية غير صحيح!" });
    }
});

// WebSocket حي للعدادات
io.on('connection', (socket) => {
    socket.on('update_live_metrics', (data) => io.emit('broadcast_metrics', data));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`[+] TARIM OS v12.1 Sovereign running on ${PORT}`));
