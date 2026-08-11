// database.js - TARIM OS V7.3 Sovereign Database - IMPERIAL SHIELD
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// 1. مسارات سيادية بصلاحيات محصنة
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tarim-database.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'tarim-database.backup.json');

// 2. تأمين وزارة الداخلية بصلاحية 700 - لا أحد يدخل إلا الإمبراطور
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

// 3. كلمة السر المشفرة بـ bcrypt - تم توليدها بـ 12 جولة
const EMPEROR_PASSWORD_HASH = '$2a$12$Lq3f5zV9yB9w8x7a6s5d4e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u';

const defaultData = {
    users: [
        { 
            id: crypto.randomUUID(), 
            username: "AL", 
            passwordHash: EMPEROR_PASSWORD_HASH,
            role: "Emperor", 
            name: "الإمبراطور AL", 
            okxBalance: 1000, 
            wallet: "0x53...ab96", 
            followers: 1, 
            following: 0,
            createdAt: new Date().toISOString()
        }
    ],
    posts: [],
    comments: [],
    likes: []
};

let dbData = null;
let isSaving = false;
let saveQueue = false;

// 4. التحميل الآمن مع نسخ احتياطي
function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, { encoding: 'utf8', flag: 'r' });
            if (raw.trim()) {
                dbData = JSON.parse(raw);
                if (!dbData.users || !dbData.posts) throw new Error('DB Corrupted');
                console.log('[TARIM DB V7.3] تم تحميل القاعدة السيادية - المستخدمين:', dbData.users.length);
                return;
            }
        }
        dbData = JSON.parse(JSON.stringify(defaultData));
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), { encoding: 'utf8', mode: 0o600 });
        console.log('[TARIM DB V7.3] تم إنشاء القاعدة الإمبراطورية لأول مرة بصلاحية 600');
    } catch (e) {
        console.error('[TARIM DB] فشل التحميل، محاولة استعادة النسخة الاحتياطية:', e.message);
        try {
            if (fs.existsSync(DB_BACKUP_FILE)) {
                const backup = fs.readFileSync(DB_BACKUP_FILE, 'utf8');
                dbData = JSON.parse(backup);
                console.log('[TARIM DB] تمت الاستعادة من النسخة الاحتياطية');
            } else {
                dbData = JSON.parse(JSON.stringify(defaultData));
            }
        } catch {
            dbData = JSON.parse(JSON.stringify(defaultData));
        }
    }
}
loadDB();

// 5. الحفظ الذري المحصن - لا يعلق السيرفر + نسخ احتياطي تلقائي
function saveDB() {
    if (isSaving) {
        saveQueue = true;
        return;
    }
    isSaving = true;
    try {
        if (fs.existsSync(DB_FILE)) {
            fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
        }
        const tempFile = DB_FILE + '.tmp.' + crypto.randomUUID();
        fs.writeFileSync(tempFile, JSON.stringify(dbData, null, 2), { encoding: 'utf8', mode: 0o600 });
        fs.renameSync(tempFile, DB_FILE);
    } catch (e) {
        console.error('[TARIM DB V7.3] فشل الحفظ السيادي:', e.message);
    } finally {
        isSaving = false;
        if (saveQueue) {
            saveQueue = false;
            setImmediate(saveDB);
        }
    }
}

// 6. واجهة سيادية محصنة V7.3
const db = {
    getUserByUsername: (username) => {
        if (!username || typeof username !== 'string') return null;
        return dbData.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    },
    verifyPassword: async (plainPassword, hash) => {
        return await bcrypt.compare(plainPassword, hash);
    },
    hashPassword: async (plainPassword) => {
        return await bcrypt.hash(plainPassword, 12);
    },
    getAllPosts: () => [...dbData.posts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
    createPost: (postData) => {
        const newPost = {
            id: crypto.randomUUID(),
            likes: 0,
            commentsCount: 0,
            createdAt: new Date().toISOString(),
            ...postData
        };
        dbData.posts.unshift(newPost);
        saveDB();
        return newPost;
    },
    likePost: (postId, userId) => {
        const post = dbData.posts.find(p => p.id == postId);
        if (!post) return null;
        const alreadyLiked = dbData.likes.find(l => l.postId == postId && l.userId == userId);
        if (alreadyLiked) {
            dbData.likes = dbData.likes.filter(l => !(l.postId == postId && l.userId == userId));
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.likes++;
            dbData.likes.push({ id: crypto.randomUUID(), postId, userId, createdAt: new Date().toISOString() });
        }
        saveDB();
        return post.likes;
    },
    save: saveDB,
    get users() { return dbData.users },
    get posts() { return dbData.posts }
};

module.exports = db;
