/**
 * TARIM OS - موجّه المسارات والملفات السيادي (Router.js)
 * الإشراف: أبو سلمان 👑
 */

const path = require('path');

function setupRouter(app, express) {
    // توجيه مجلد الواجهة والملفات العامة
    app.use(express.static(path.join(__dirname, 'public')));

    // مسار التحقق من سلامة القلعة
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: "Online",
            platform: "TARIM OS V1.0 Beta",
            commander: "Abu Salman",
            timestamp: new Date()
        });
    });

    // توجيه أي مسار آخر لملف الواجهة الرئيسي لمنع أخطاء 404
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

module.exports = setupRouter;

