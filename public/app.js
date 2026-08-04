/**
 * TARIM OS - الملف البرمجي السيادي للأزرار والوظائف
 * الإشراف: أبو سلمان 👑
 */

const socket = io();
let currentAuthTab = 'login';
let localStream = null;
let liveLikes = 0;
let mapInstance = null;

socket.on('connect', () => {
    console.log("🔗 متصل بالسيرفر السيادي بنجاح:", socket.id);
});

// إدارة التبويبات والدخول
document.addEventListener('DOMContentLoaded', () => {

    // التبويبات الرئيسية
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = btn.getAttribute('data-tab');
            openTab(tabName, btn);
        });
    });

    // تبديل نافذة الدخول وتسجيل جديد
    document.getElementById('tabLoginBtn').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tabRegBtn').addEventListener('click', () => switchAuthTab('register'));

    // أزرار المصادقة
    document.getElementById('authActionBtn').addEventListener('click', processLogin);
    document.getElementById('googleAuthBtn').addEventListener('click', processGoogleLogin);

    // الأزرار التفاعلية بالواجهة
    document.getElementById('gotoOpsBtn').addEventListener('click', () => {
        document.querySelector('[data-tab="operations"]').click();
    });
    document.getElementById('likeVideoBtn').addEventListener('click', (e) => likeVideo(e.currentTarget));
    document.getElementById('openAccountModalBtn').addEventListener('click', () => openModal('modalAccount'));
    document.getElementById('closeAccountModalBtn').addEventListener('click', () => closeModal('modalAccount'));
    document.getElementById('logoutBtn').addEventListener('click', secureLogout);

    // العمليات والبث
    document.getElementById('startStudioBtn').addEventListener('click', startLiveStudio);
    document.getElementById('toggleMapBtn').addEventListener('click', openMap);
    document.getElementById('startLiveBtn').addEventListener('click', startLiveBroadcast);
    document.getElementById('exitCamBtn').addEventListener('click', exitFullScreen);
    document.getElementById('endLiveBtn').addEventListener('click', endLiveBroadcast);
    document.getElementById('sendLiveLikeBtn').addEventListener('click', sendLiveLike);
    document.getElementById('sendCommentBtn').addEventListener('click', sendLiveCommentMsg);

    // النشر والصندوق الوارد
    document.getElementById('publishPostBtn').addEventListener('click', () => publishPost('post'));
    document.getElementById('publishVideoBtn').addEventListener('click', () => publishPost('video'));
    document.getElementById('sendInboxBtn').addEventListener('click', sendInboxMsg);

    // الحساب والختم
    document.getElementById('generateQRBtn').addEventListener('click', generateQR);
    document.getElementById('shareProfileBtn').addEventListener('click', shareProfileLink);
    document.getElementById('saveAccountBtn').addEventListener('click', saveAccountSettings);
});

function switchAuthTab(tab) {
    currentAuthTab = tab;
    const loginBtn = document.getElementById('tabLoginBtn');
    const regBtn = document.getElementById('tabRegBtn');
    const actionBtn = document.getElementById('authActionBtn');
    const otpBox = document.getElementById('otpBox');

    if (tab === 'login') {
        loginBtn.className = "text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1";
        regBtn.className = "text-xs text-slate-400 pb-1";
        actionBtn.innerText = "دخول القلعة السيادية 🔑";
        otpBox.classList.add('hidden');
    } else {
        regBtn.className = "text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1";
        loginBtn.className = "text-xs text-slate-400 pb-1";
        actionBtn.innerText = "إنشاء الحساب السيادي 🚀";
        otpBox.classList.remove('hidden');
    }
}

function processLogin() {
    const userField = document.getElementById('userPhoneOrEmail').value.trim();
    const passField = document.getElementById('userPass').value.trim();
    const authMsg = document.getElementById('authMsg');

    if (!userField || !passField) {
        authMsg.innerText = "⚠️ يرجى إدخال البيانات المطلوبة!";
        return;
    }

    authMsg.innerText = "";
    showToast("✨ تم الدخول بنجاح!");
    document.getElementById('authGate').classList.add('hidden');
    document.getElementById('homeUsername').innerText = "@" + userField;
}

function processGoogleLogin() {
    showToast("🌐 جاري الاتصال بجوجل...");
    setTimeout(() => {
        document.getElementById('authGate').classList.add('hidden');
        showToast("👑 أهلاً بك يا أبو سلمان");
    }, 1000);
}

function openTab(tabName, clickedBtn) {
    const tabs = ['home', 'operations', 'create', 'inbox', 'profile'];
    tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.classList.add('hidden');
    });

    const targetTab = document.getElementById('tab-' + tabName);
    if (targetTab) targetTab.classList.remove('hidden');

    if (tabName !== 'operations' && tabName !== 'create') {
        stopCameraFeed();
    }

    if (clickedBtn) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.replace('text-cyan-400', 'text-slate-400'));
        clickedBtn.classList.replace('text-slate-400', 'text-cyan-400');
    }
}

function showToast(message) {
    const toastBox = document.getElementById('toastBox');
    const alertDiv = document.createElement('div');
    alertDiv.className = "bg-cyan-500 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-lg mt-2 text-center w-full";
    alertDiv.innerText = message;
    toastBox.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 2500);
}

function likeVideo(btn) {
    const countSpan = btn.querySelector('.like-count');
    let count = parseInt(countSpan.innerText);
    count++;
    countSpan.innerText = count;
    showToast("❤️ تم إبداء الإعجاب");
}

function generateQR() {
    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = "";
    new QRCode(qrcodeContainer, {
        text: "https://tarimos.org/?ref=sovereign_al",
        width: 120,
        height: 120,
        colorDark: "#00f0ff",
        colorLight: "#030b1a"
    });
    showToast("🖨️ تم إصدار الختم QR");
}

function openMap() {
    const mapCont = document.getElementById('mapContainer');
    mapCont.classList.toggle('hidden');
    if (!mapCont.classList.contains('hidden') && !mapInstance) {
        setTimeout(() => {
            mapInstance = L.map('map').setView([16.0042, 48.9814], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
            L.marker([16.0042, 48.9814]).addTo(mapInstance).bindPopup('تريم - حضرموت').openPopup();
        }, 300);
    }
}

function sendInboxMsg() {
    const input = document.getElementById('inboxInput');
    if (!input.value.trim()) return;
    const inboxList = document.getElementById('inboxMessages');
    inboxList.innerHTML += `<div class="glass p-2.5 rounded-xl text-xs text-cyan-200 text-left"><b>أبو سلمان:</b> ${input.value}</div>`;
    input.value = "";
    showToast("🚀 تم الإرسال");
}

function startLiveStudio() {
    document.getElementById('fullScreenCam').classList.remove('hidden');
    document.getElementById('preLiveOverlay').classList.remove('hidden');
}

function startLiveBroadcast() {
    document.getElementById('preLiveOverlay').classList.add('hidden');
    document.getElementById('liveChatBox').classList.remove('hidden');
    showToast("🔴 بدأ البث المباشر!");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => { localStream = stream; document.getElementById('fullCamVideo').srcObject = stream; })
        .catch(() => showToast("⚠️ يعمل البث بوضع المحاكاة"));
}

function endLiveBroadcast() { stopCameraFeed(); document.getElementById('fullScreenCam').classList.add('hidden'); }
function exitFullScreen() { stopCameraFeed(); document.getElementById('fullScreenCam').classList.add('hidden'); }
function stopCameraFeed() { if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; } }

function sendLiveLike() {
    liveLikes++;
    document.getElementById('liveLikesCount').innerText = liveLikes;
}

function sendLiveCommentMsg() {
    const input = document.getElementById('liveCommentInput');
    if(!input.value.trim()) return;
    document.getElementById('liveCommentsList').innerHTML += `<div class="text-xs text-cyan-300 bg-black/60 p-1.5 rounded"><b>أبو سلمان:</b> ${input.value}</div>`;
    input.value = "";
}

function publishPost(type) {
    showToast(type === 'post' ? "📢 تم نشر المنشور بنجاح" : "🎥 تم رفع الفيديو بنجاح");
    document.getElementById('postDescInput').value = "";
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function saveAccountSettings() {
    document.getElementById('profileNameDisplay').innerText = document.getElementById('editNameInput').value;
    document.getElementById('profileEmailDisplay').innerText = document.getElementById('editEmailInput').value;
    closeModal('modalAccount');
    showToast("✅ تم الحفظ");
}

function shareProfileLink() {
    navigator.clipboard.writeText("https://tarimos.org/@sovereign_al");
    showToast("🔗 تم النسخ");
}

function secureLogout() {
    if(confirm("تسجيل الخروج؟")) document.getElementById('authGate').classList.remove('hidden');
}

