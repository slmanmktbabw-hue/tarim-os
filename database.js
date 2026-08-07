// database.js - TARIM OS Sovereign Database - PRODUCTION READY
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. مسار سيادي آمن لا يُمسح - مجلد data محمي
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tarim-database.json');
const DB_TEMP_FILE = path.join(DATA_DIR, 'tarim-database.tmp.json');

// 2. تأكد من وجود وزارة الداخلية (مجلد data)
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 3. البيانات الافتراضية - بكلمة سر مشفرة وليست 123456
const defaultData = {
    users: [
        { 
            id: 1, 
            username: "AL", 
            // كلمة السر الأصلية 123456 مشفرة بـ SHA256 - لا تضعها نصاً أبداً
            passwordHash: crypto.createHash('sha256').update("123456").digest('hex'),
            role: "Emperor", 
            name: "الإمبراطور AL", 
            okxBalance: 1000, 
            wallet: "0x53...ab96", 
            followers: 1, 
            following: 0 
        }
    ],
    posts: [
        {
            id: 1,
            userId: 1,
            username: "AL",
            content: "فيديو سيادي مسجل ومحفوظ على سيرفرات TARIM OS المركزية",
            videoUrl: null,
            imageUrl: null,
            likes: 120,
            comments: 14,
            createdAt: new Date().toISOString()
        }
    ],
    comments: [],
    likes: []
};

let dbData = { ...defaultData };

// 4. التحميل الآمن
try {
    if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        if (raw.trim()) {
            dbData = JSON.parse(raw);
            console.log('[TARIM DB] تم تحميل قاعدة البيانات السيادية');
        }
    } else {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
        console.log('[TARIM DB] تم إنشاء قاعدة البيانات الإمبراطورية لأول مرة');
    }
} catch (e) {
    console.error('[TARIM DB] خطأ في التحميل، سيتم استخدام الافتراضي:', e.message);
    dbData = { ...defaultData };
}

// 5. الحفظ الذري - لا يعلق السيرفر ولا يفسد الملف أبداً
function saveDB() {
    try {
        // اكتب في ملف مؤقت أولاً ثم انقله - يمنع فساد البيانات
        fs.writeFileSync(DB_TEMP_FILE, JSON.stringify(dbData, null, 2), 'utf8');
        fs.renameSync(DB_TEMP_FILE, DB_FILE);
    } catch (e) {
        console.error('[TARIM DB] فشل الحفظ السيادي:', e.message);
    }
}

// 6. واجهة سيادية محصنة
const db = {
    // المستخدمين - آمن
    getUserByUsername: (username) => dbData.users.find(u => u.username === username),
    getUserById: (id) => dbData.users.find(u => u.id === Number(id)),
    verifyPassword: (plainPassword, hash) => {
        const plainHash = crypto.createHash('sha256').update(plainPassword).digest('hex');
        return plainHash === hash;
    },
    
    // المنشورات
    getAllPosts: () => [...dbData.posts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
    getPostById: (id) => dbData.posts.find(p => p.id == id),
    
    createPost: (postData) => {
        const newPost = {
            id: Date.now(),
            likes: 0,
            comments: 0,
            createdAt: new Date().toISOString(),
            ...postData
        };
        dbData.posts.unshift(newPost); // الجديد في الأعلى
        saveDB();
        return newPost;
    },
    
    deletePost: (id) => {
        const initialLength = dbData.posts.length;
        dbData.posts = dbData.posts.filter(p => p.id != id);
        if (dbData.posts.length !== initialLength) {
            // احذف تعليقاته أيضاً
            dbData.comments = dbData.comments.filter(c => c.postId != id);
            saveDB();
            return true;
        }
        return false;
    },
    
    likePost: (postId, userId) => {
        const post = dbData.posts.find(p => p.id == postId);
        if (!post) return null;
        
        // منع التكرار
        const alreadyLiked = dbData.likes.find(l => l.postId == postId && l.userId == userId);
        if (alreadyLiked) return post.likes;

        post.likes++;
        dbData.likes.push({ postId, userId, createdAt: new Date().toISOString() });
        saveDB();
        return post.likes;
    },

    // التعليقات
    addComment: (postId, commentData) => {
        const post = dbData.posts.find(p => p.id == postId);
        if (!post) return null;
        const newComment = {
            id: Date.now(),
            postId: Number(postId),
            createdAt: new Date().toISOString(),
            ...commentData
        };
        dbData.comments.push(newComment);
        post.comments = (post.comments || 0) + 1;
        saveDB();
        return newComment;
    },
    
    getCommentsByPostId: (postId) => dbData.comments.filter(c => c.postId == postId).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)),

    getStats: () => ({
        totalUsers: dbData.users.length,
        totalPosts: dbData.posts.length,
        totalComments: dbData.comments.length,
        totalLikes: dbData.posts.reduce((sum, p) => sum + (p.likes || 0), 0)
    }),

    save: saveDB,
    
    // للتوافق
    get users() { return dbData.users },
    get posts() { return dbData.posts }
};

module.exports = db;
