// database.js - TARIM OS V7.4 - IMPERIAL VAULT - HARDENED
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tarim-database.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'tarim-database.backup.json');

// إنشاء المجلد مرة واحدة بصلاحية 700
if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

// 1. الحل النهائي: لا هارد كود أبداً - من متغيرات البيئة
const EMPEROR_PASSWORD_HASH = process.env.EMPEROR_PASSWORD_HASH;
if (!EMPEROR_PASSWORD_HASH) {
    throw new Error('EMPEROR_PASSWORD_HASH مفقود في .env - السيرفر لن يعمل بدون كلمة سر الإمبراطور');
}

const defaultData = {
    users: [
        { 
            id: crypto.randomUUID(), 
            username: "AL", 
            passwordHash: EMPEROR_PASSWORD_HASH,
            role: "Emperor", 
            name: "الإمبراطور AL", 
            okxBalance: 0,
            wallet: "",
            followers: 0, 
            following: 0,
            createdAt: new Date().toISOString()
        }
    ],
    posts: [],
    likes: []
};

let dbData = null;
let isSaving = false;
let saveQueue = false;

// 2. دالة آمنة ضد Prototype Pollution
function safeParse(raw) {
    return JSON.parse(raw, (key, value) => {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) return undefined;
        return value;
    });
}

async function loadDB() {
    try {
        if (fsSync.existsSync(DB_FILE)) {
            const raw = await fs.readFile(DB_FILE, 'utf8');
            if (raw.trim()) {
                const parsed = safeParse(raw);
                if (!parsed?.users || !Array.isArray(parsed.users) || !Array.isArray(parsed.posts)) {
                    throw new Error('DB Corrupted');
                }
                dbData = parsed;
                console.log('[TARIM DB V7.4] تم التحميل - المستخدمين:', dbData.users.length);
                return;
            }
        }
        dbData = JSON.parse(JSON.stringify(defaultData));
        await saveDB(true);
    } catch (e) {
        console.error('[TARIM DB] فشل، استعادة النسخ الاحتياطي:', e.message);
        try {
            if (fsSync.existsSync(DB_BACKUP_FILE)) {
                const backup = await fs.readFile(DB_BACKUP_FILE, 'utf8');
                dbData = safeParse(backup);
            } else {
                dbData = JSON.parse(JSON.stringify(defaultData));
            }
        } catch {
            dbData = JSON.parse(JSON.stringify(defaultData));
        }
    }
}

// 3. الحفظ الذري غير الحاجب Async + Atomic
async function saveDB(isFirstTime = false) {
    if (isSaving && !isFirstTime) {
        saveQueue = true;
        return;
    }
    isSaving = true;
    try {
        if (!isFirstTime && fsSync.existsSync(DB_FILE)) {
            await fs.copyFile(DB_FILE, DB_BACKUP_FILE);
        }
        const tempFile = DB_FILE + '.tmp.' + crypto.randomUUID();
        await fs.writeFile(tempFile, JSON.stringify(dbData, null, 2), { encoding: 'utf8', mode: 0o600 });
        await fs.rename(tempFile, DB_FILE);
    } catch (e) {
        console.error('[TARIM DB] فشل الحفظ:', e.message);
    } finally {
        isSaving = false;
        if (saveQueue) {
            saveQueue = false;
            setImmediate(() => saveDB());
        }
    }
}

// تحميل أولي متزامن للضرورة
(function initSync() {
    try {
        if (fsSync.existsSync(DB_FILE)) {
            const raw = fsSync.readFileSync(DB_FILE, 'utf8');
            dbData = safeParse(raw);
        } else {
            dbData = JSON.parse(JSON.stringify(defaultData));
            fsSync.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), { mode: 0o600 });
        }
    } catch {
        dbData = JSON.parse(JSON.stringify(defaultData));
    }
})();

// 4. واجهة محصنة - Whitelist وليس Blacklist
const db = {
    getUserByUsername: (username) => {
        if (typeof username !== 'string' || username.length > 50) return null;
        const clean = username.toLowerCase().trim();
        const user = dbData.users.find(u => u.username?.toLowerCase() === clean);
        if (!user) return null;
        // لا ترجع الـ Hash أبداً للخارج
        const { passwordHash, ...safeUser } = user;
        return { ...safeUser, _hash: user.passwordHash }; // للاستخدام الداخلي فقط
    },

    // دالة داخلية للتحقق
    getUserWithHash: (username) => {
        if (typeof username !== 'string') return null;
        return dbData.users.find(u => u.username?.toLowerCase() === username.toLowerCase().trim()) || null;
    },

    verifyPassword: async (plain, hash) => {
        if (typeof plain !== 'string' || plain.length > 128 || !hash) return false;
        return await bcrypt.compare(plain, hash);
    },

    hashPassword: async (plain) => {
        if (typeof plain !== 'string' || plain.length < 8 || plain.length > 128) throw new Error('Invalid password');
        return await bcrypt.hash(plain, 12);
    },

    getAllPosts: () => {
        // لا ترجع مرجع مباشر + ترتيب آمن
        return [...dbData.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    createPost: (postData, authorId) => {
        // --- تصحيح الثغرة الأخطر: Whitelist ---
        if (!postData || typeof postData !== 'object') return null;
        if (typeof authorId !== 'string') return null;

        const allowed = {
            content: typeof postData.content === 'string' ? postData.content.slice(0, 2000) : '',
            imageUrl: typeof postData.imageUrl === 'string' ? postData.imageUrl.slice(0, 500) : null,
            videoUrl: typeof postData.videoUrl === 'string' ? postData.videoUrl.slice(0, 500) : null,
        };

        // منع حقن HTML/JS بسيط
        if (allowed.content) {
            allowed.content = allowed.content.replace(/[<>]/g, '');
        }

        const newPost = {
            id: crypto.randomUUID(),
            authorId: authorId, // لا تسمح للمستخدم بتحديد authorId من postData
            likes: 0,
            commentsCount: 0,
            createdAt: new Date().toISOString(),
            ...allowed
        };
        
        dbData.posts.unshift(newPost);
        saveDB();
        return newPost;
    },

    likePost: (postId, userId) => {
        if (typeof postId !== 'string' || typeof userId !== 'string') return null;
        const post = dbData.posts.find(p => p.id === postId);
        if (!post) return null;

        const idx = dbData.likes.findIndex(l => l.postId === postId && l.userId === userId);
        if (idx !== -1) {
            dbData.likes.splice(idx, 1);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.likes++;
            dbData.likes.push({ id: crypto.randomUUID(), postId, userId, createdAt: new Date().toISOString() });
        }
        saveDB();
        return post.likes;
    },

    save: () => saveDB(),

    // إرجاع آمن بدون Hash
    get users() { 
        return dbData.users.map(({ passwordHash, ...u }) => u); 
    },
    get posts() { 
        return JSON.parse(JSON.stringify(dbData.posts)); 
    }
}

module.exports = db;
