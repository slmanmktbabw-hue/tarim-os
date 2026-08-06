// --- تفاعلات الصفحة الرئيسية (Home Feed) ---
let homeLikesCount = 120;
function toggleLike() {
    homeLikesCount++;
    const display = document.getElementById('likeCountDisplay');
    if (display) display.innerText = homeLikesCount;
    showToast('❤️ تم تسجيل الإعجاب السيادي بنجاح');
}

function triggerComment() {
    const comment = prompt('اكتب تعليقك السيادي:');
    if (comment && comment.trim() !== '') {
        showToast('💬 تم نشر التعليق بنجاح في القلعة');
    }
}

function savePost() {
    showToast('⭐ تمت إضافة المنشور إلى المحفوظات الملكية');
}

// --- تفاعلات العمليات (Operations) ---
function openOperationsLive() {
    switchTab('create', document.querySelectorAll('.nav-btn')[2]);
    startLiveStream();
}

function openOperationsInbox() {
    switchTab('inbox', document.querySelectorAll('.nav-btn')[3]);
}

// --- تفاعلات ملف المستخدم والإعدادات الملكية (Profile Tools) ---
function openOkxWallet() {
    showToast('💳 رصيد OKX الملكي: 0.00 USDT (المحفظة مؤمنة بالكامل)');
}

function openActivityCenter() {
    showToast('🏛️ مركز الأنشطة: سجل العمليات السيادية نظيف ومؤمن');
}

function openOfflineVideos() {
    showToast('📹 فيديوهات دون اتصال: تم تفعيل التخزين المؤقت بنجاح Offline');
}

function openBusinessGroup() {
    showToast('👥 المجموعة التجارية: جاهزة لإدارة الحملات والخدمات');
}

function openPostManagement() {
    showToast('📊 إدارة المنشورات: لا توجد منشورات محظورة، الكل نشط');
}

function shareProfileLink() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText('https://tarimos.org/user/AL');
        showToast('🔗 تم نسخ رابط الملف الشخصي السيادي للحافظة');
    } else {
        showToast('🔗 رابط الملف: https://tarimos.org/user/AL');
    }
}

function openPrivacyPolicy() {
    window.location.href = 'privacy.html';
}

function changeUserBackground() {
    const colors = ['#030B1A', '#0F172A', '#022338', '#1a0033'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.style.backgroundColor = randomColor;
    showToast('🎨 تم تغيير خلفية النظام الإمبراطوري بنجاح');
}
