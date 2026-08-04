/**
 * TARIM OS - نظام التخزين وإدارة البيانات السيادية
 * الإشراف: أبو سلمان
 */

const fs = require('fs');
const path = require('path');

// مسار ملف التخزين المحلي الآمن للبيانات البسيطة (JSON Storage)
const storageFilePath = path.join(__dirname, 'sovereign_storage.json');

function initDatabase() {
    if (!fs.existsSync(storageFilePath)) {
        const initialData = {
            users: [],
            posts: [],
            logs: [{ event: "System Initialized", timestamp: new Date() }]
        };
        fs.writeFileSync(storageFilePath, JSON.stringify(initialData, null, 2), 'utf8');
        console.log("💾 تم إنشاء ملف التخزين السيادي المحلي بنجاح.");
    } else {
        console.log("💾 قاعدة البيانات والتخزين السيادي جاهز ومتصل.");
    }
}

// دالة لجلب البيانات المخزنة
function getSovereignData() {
    try {
        if (fs.existsSync(storageFilePath)) {
            const data = fs.readFileSync(storageFilePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("❌ خطأ في قراءة التخزين السيادي:", err);
    }
    return { users: [], posts: [], logs: [] };
}

// دالة لحفظ البيانات الجديدة
function saveSovereignData(data) {
    try {
        fs.writeFileSync(storageFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error("❌ خطأ في حفظ البيانات السيادية:", err);
        return false;
    }
}

module.exports = {
    initDatabase,
    getSovereignData,
    saveSovereignData
};

