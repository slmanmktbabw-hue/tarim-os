// قاعدة بيانات سيادية محاكاة مع حفظ دائم - TARIM OS
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'tarim-database.json');

// تحميل البيانات من الملف إذا موجود، وإلا أنشئ افتراضي
let dbData = {
    users: [
        { id: 1, username: "AL", password: "123456", role: "Emperor", name: "الإمبراطور AL", okxBalance: 1000, wallet: "0x53...ab96", followers: 1, following: 0 }
    ],
    posts: [
        {
            id: 1,
            userId: 1,
            username: "AL",
            content: "فيديو سيادي مسجل ومحفوظ على سيرفرات TARIM OS المركزية 🎥✨",
            videoUrl: null,
            likes: 120,
            comments: 14,
            createdAt: new Date().toISOString()
        }
    ],
    comments: [],
    likes: []
};

// حاول تقرأ الملف إذا موجود
try {
    if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        dbData = JSON.parse(raw);
        console.log('✅ تم تحميل قاعدة البيانات السيادية من الملف');
    }
} catch (e) {
    console.log('⚠️ سيتم إنشاء قاعدة بيانات جديدة');
}

// دالة الحفظ التلقائي
function saveDB() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
    } catch (e) {
        console.error('❌ خطأ في حفظ قاعدة البيانات:', e.message);
    }
}

// واجهة قاعدة البيانات السيادية
const db = {
    // المستخدمين
    getUserByUsername: (username) => dbData.users.find(u => u.username === username),
    getUserById: (id) => dbData.users.find(u => u.id === id),
    
    // المنشورات
    getAllPosts: () => dbData.posts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
    getPostById: (id) => dbData.posts.find(p => p.id == id),
    createPost: (postData) => {
        const newPost = {
            id: Date.now(),
            likes: 0,
            comments: 0,
            createdAt: new Date().toISOString(),
            ...postData
        };
        dbData.posts.push(newPost);
        saveDB();
        return newPost;
    },
    deletePost: (id) => {
        const index = dbData.posts.findIndex(p => p.id == id);
        if (index !== -1) {
            dbData.posts.splice(index, 1);
            saveDB();
            return true;
        }
        return false;
    },
    likePost: (postId) => {
        const post = dbData.posts.find(p => p.id == postId);
        if (post) {
            post.likes++;
            saveDB();
            return post.likes;
        }
        return null;
    },

    // التعليقات
    addComment: (postId, commentData) => {
        const newComment = {
            id: Date.now(),
            postId: postId,
            createdAt: new Date().toISOString(),
            ...commentData
        };
        dbData.comments.push(newComment);
        // زود عداد التعليقات في المنشور
        const post = dbData.posts.find(p => p.id == postId);
        if (post) post.comments++;
        saveDB();
        return newComment;
    },
    getCommentsByPostId: (postId) => dbData.comments.filter(c => c.postId == postId),

    // الإحصائيات
    getStats: () => ({
        totalUsers: dbData.users.length,
        totalPosts: dbData.posts.length,
        totalComments: dbData.comments.length,
        totalLikes: dbData.posts.reduce((sum, p) => sum + p.likes, 0)
    }),

    // حفظ يدوي
    save: saveDB,
    
    // البيانات الخام (للتوافق مع الكود القديم)
    users: dbData.users,
    posts: dbData.posts
};

module.exports = db;
