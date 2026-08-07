const db = require('./database');

// جلب كل المنشورات
router.get('/posts', (req, res) => {
    res.json({ success: true, posts: db.getAllPosts() });
});

// لايك
router.post('/posts/:id/like', (req, res) => {
    const likes = db.likePost(req.params.id);
    res.json({ success: true, likes });
});
