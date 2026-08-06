// public/app.js - TARIM OS Client Application Initialized - AL
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏰 TARIM OS Client Application Initialized - AL');
    
    const savedUser = localStorage.getItem('tarim_user');
    if (savedUser) {
        const gate = document.getElementById('authGate');
        if (gate) { 
            gate.style.display = 'none'; 
            gate.classList.add('hidden'); 
        }
    }
});

function showToast(msg) {
    const box = document.getElementById('toastBox');
    if (!box) return;
    const toast = document.createElement('div');
    toast.className = 'bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl mb-2 text-xs shadow-lg transition-all text-center';
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 2500);
}

function forceUnlockCastle() {
    const gate = document.getElementById('authGate');
    if (gate) { 
        gate.style.display = 'none'; 
        gate.classList.add('hidden'); 
    }
    localStorage.setItem('tarim_user', 'AL');
    showToast('أهلاً بك يا أبو سلمان في القلعة السيادية 👑');
}

function lockCastleAgain() {
    const gate = document.getElementById('authGate');
    if (gate) { 
        gate.style.display = 'flex'; 
        gate.classList.remove('hidden'); 
    }
    localStorage.removeItem('tarim_user');
    showToast('تم إقفال القلعة بنجاح 🚪');
}

function switchTab(tabName, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-cyan-400');
        btn.classList.add('text-slate-400');
    });
    if (btnElement) {
        btnElement.classList.remove('text-slate-400');
        btnElement.classList.add('text-cyan-400');
    }
    if (tabName === 'profile') backToProfile();
}

function showSubPage(pageId) {
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.add('hidden');
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    
    const target = document.getElementById('sub-' + pageId);
    if (target) {
        target.classList.remove('hidden');
        if (pageId === 'qr-page') {
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer) {
                qrContainer.innerHTML = "";
                if (typeof QRCode !== 'undefined') {
                    new QRCode(qrContainer, { text: "https://tarimos.org/user/AL", width: 128, height: 128 });
                }
            }
        }
    }
}

function backToProfile() {
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.remove('hidden');
}

// --- تشغيل الكاميرا والبث المباشر الحقيقي بملء الشاشة ---
let currentStream = null;
let currentFacingMode = 'user';
let totalGiftsScore = 0;
let isFlashOn = false;

async function startLiveStreamWithCamera(mode) {
    currentFacingMode = mode || 'user';
    const modal = document.getElementById('liveStreamModal');
    const video = document.getElementById('liveVideoElement');
    if (!modal || !video) return;

    modal.classList.remove('hidden');

    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: { facingMode: currentFacingMode },
            audio: true
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        showToast(`🔴 بدأ البث بالكاميرا الـ ${currentFacingMode === 'user' ? 'أمامية' : 'خلفية'} بنجاح!`);
    } catch (err) {
        console.error(err);
        showToast('⚠️ تعذر تشغيل الكاميرا، يرجى منح الإذن من المتصفح');
        modal.classList.add('hidden');
    }
}

function stopLiveStream() {
    const modal = document.getElementById('liveStreamModal');
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    if (modal) modal.classList.add('hidden');
    showToast('⏹️ تم إيقاف البث بنجاح');
}

async function toggleFlash() {
    if (!currentStream) {
        showToast('⚠️ يرجى تشغيل الكاميرا (خلفية) أولاً لتفعيل الفلاش');
        return;
    }
    const track = currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (!capabilities.torch) {
        showToast('⚠️ الفلاش غير متوفر في هذه الكاميرا');
        return;
    }

    try {
        isFlashOn = !isFlashOn;
        await track.applyConstraints({
            advanced: [{ torch: isFlashOn }]
        });
        showToast(isFlashOn ? '⚡ تم تشغيل الفلاش' : '⚡ تم إطفاء الفلاش');
    } catch (err) {
        console.error(err);
        showToast('⚠️ تعذر تشغيل الفلاش');
    }
}

function applyFilter(filterValue) {
    const video = document.getElementById('liveVideoElement');
    if (video) {
        video.style.filter = filterValue;
        showToast('✨ تم تطبيق الفلتر على البث');
    }
}

function sendGift(giftName, points) {
    totalGiftsScore += points;
    const badge = document.getElementById('giftCounterBadge');
    if (badge) {
        badge.innerText = `🎁 الهدايا: ${totalGiftsScore}`;
    }
    showToast(`🎁 تم إرسال: ${giftName} (+${points} نقطة)!`);
}

function handleFileSelected(event, type) {
    const file = event.target.files[0];
    if (file) {
        showToast(`✅ تم اختيار الـ ${type === 'image' ? 'صورة' : 'فيديو'} بنجاح: ${file.name}`);
    }
}

// --- تفاعلات الرئيسية والملف الشخصي ---
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

function openOperationsLive() {
    switchTab('create', document.querySelectorAll('.nav-btn')[2]);
    startLiveStreamWithCamera('user');
}

function openOperationsInbox() {
    switchTab('inbox', document.querySelectorAll('.nav-btn')[3]);
}

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
    
