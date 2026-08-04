/**
 * TARIM OS - الملف البرمجي السيادي للأزرار والوظائف
 * الإشراف: أبو سلمان 👑
 */

const socket = io();
let currentAuthTab = 'login';
let localStream = null;
let liveLikesCount = 0;
let mapInstance = null;
let flashState = false;

socket.on('connect', () => {
    console.log("🔗 متصل بالسيفر السيادي بنجاح:", socket.id);
});

document.addEventListener('DOMContentLoaded', () => {

    // التنقل بين التبويبات
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = btn.getAttribute('data-tab');
            openTab(tabName, btn);
        });
    });

    // المصادقة
    document.getElementById('tabLoginBtn').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tabRegBtn').addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('authActionBtn').addEventListener('click', processLogin);
    document.getElementById('googleAuthBtn').addEventListener('click', processGoogleLogin);

    // الهيدر والنافذة العلوية
    document.getElementById('openAiEyeBtn').addEventListener('click', () => openModal('modalAiEye'));
    document.getElementById('openSupportBtn').addEventListener('click', () => openModal('modalSupport'));
    document.getElementById('sendSupportBtn').addEventListener('click', sendSupportMessage);

    // قسم العمليات
    document.getElementById('opLiveBtn').addEventListener('click', () => { document.querySelector('[data-tab="create"]').click(); startCameraStudio(); });
    document.getElementById('opInboxBtn').addEventListener('click', () => { document.querySelector('[data-tab="inbox"]').click(); });
    document.getElementById('opMapBtn').addEventListener('click', toggleMapOffline);
    document.getElementById('opQrBtn').addEventListener('click', generateOperationsQR);

    // الإنشاء والكاميرا
    document.getElementById('openCamStudioBtn').addEventListener('click', startCameraStudio);
    document.getElementById('startLiveStudioBtn').addEventListener('click', startCameraStudio);
    document.getElementById('exitCamBtn').addEventListener('click', closeCameraStudio);
    document.getElementById('closeCamStudioBtn').addEventListener('click', closeCameraStudio);
    document.getElementById('toggleFlashBtn').addEventListener('click', toggleFlashlight);
    document.getElementById('sendLiveHeartBtn').addEventListener('click', () => { liveLikesCount++; document.getElementById('liveHeartCount').innerText = liveLikesCount; });
    document.getElementById('sendLiveCommentBtn').addEventListener('click', sendLiveComment);
    document.getElementById('publishTextBtn').addEventListener('click', () => { showToast("📢 تم نشر المنشور السيادي بنجاح"); document.getElementById('postContentInput').value = ""; });

    // الوارد
    document.getElementById('sendInboxMsgBtn').addEventListener('click', sendInboxMessage);

    // الملف الشخصي
    document.getElementById('logoutProfileBtn').addEventListener('click', logoutSystem);

    // توليد QR الأولي
    generateInitialQR();
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
    showToast("✨ أهلاً بك يا أبو سلمان في القلعة!");
    document.getElementById('authGate').classList.add('hidden');
    document.getElementById('homeUsernameDisplay').innerText = "@" + userField + " 👑";
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

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function generateInitialQR() {
    const box = document.getElementById('operationsQrBox');
    if (box && box.children.length === 0) {
        new QRCode(box, {
            text: "https://tarimos.org/?sovereign=al",
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });
    }
}

function generateOperationsQR() {
    showToast("🧾 تم إصدار الختم الميداني بنجاح");
}

function toggleMapOffline() {
    const mapEl = document.getElementById('mapContainer');
    mapEl.classList.toggle('hidden');
    if (!mapEl.classList.contains('hidden') && !mapInstance) {
        setTimeout(() => {
            mapInstance = L.map('mapContainer').setView([16.0042, 48.9814], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
            L.marker([16.0042, 48.9814]).addTo(mapInstance).bindPopup('تريم - حضرموت التاريخية').openPopup();
        }, 300);
    }
}

function startCameraStudio() {
    document.getElementById('fullScreenCam').classList.remove('hidden');
    document.getElementById('liveChatOverlay').classList.remove('hidden');
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true })
        .then(stream => {
            localStream = stream;
            document.getElementById('fullCamVideo').srcObject = stream;
        })
        .catch(() => {
            showToast("⚠️ تشغيل وضع محاكاة الكاميرا الميدانية");
        });
}

function closeCameraStudio() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    document.getElementById('fullScreenCam').classList.add('hidden');
}

async function toggleFlashlight() {
    if (!localStream) {
        showToast("⚠️ افتح الكاميرا أولاً لتفعيل الفلاش");
        return;
    }
    try {
        const track = localStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
            flashState = !flashState;
            await track.applyConstraints({ advanced: [{ torch: flashState }] });
            document.getElementById('toggleFlashBtn').innerText = flashState ? "🔦 فلاش: مفعل" : "🔦 فلاش: معطل";
            showToast(flashState ? "💡 تم تشغيل الفلاش" : "💡 تم إطفاء الفلاش");
        } else {
            showToast("⚠️ الفلاش غير مدعوم في هذا الجهاز");
        }
    } catch (e) {
        showToast("⚠️ تعذر تشغيل فلاش الكاميرا");
    }
}

function sendLiveComment() {
    const input = document.getElementById('liveCommentInput');
    if (!input.value.trim()) return;
    const box = document.getElementById('liveCommentsBox');
    box.innerHTML += `<div class="text-xs text-cyan-300 bg-black/70 p-1.5 rounded"><b>أبو سلمان:</b> ${input.value}</div>`;
    input.value = "";
}

function sendInboxMessage() {
    const input = document.getElementById('inboxInputField');
    if (!input.value.trim()) return;
    const list = document.getElementById('inboxMessagesList');
    list.innerHTML += `<div class="glass p-2.5 rounded-xl text-xs text-cyan-200 text-left"><b>أبو سلمان:</b> ${input.value}</div>`;
    input.value = "";
    showToast("🚀 تم إرسال الرسالة السيادية");
}

function sendSupportMessage() {
    const input = document.getElementById('supportInput');
    if (!input.value.trim()) return;
    const list = document.getElementById('supportChatList');
    list.innerHTML += `<div class="bg-slate-800 text-white p-2.5 rounded-xl text-right"><b>أبو سلمان:</b> ${input.value}</div>`;
    
    setTimeout(() => {
        list.innerHTML += `<div class="bg-blue-500/20 text-blue-200 p-2.5 rounded-xl border border-blue-500/30"><b>فريق الدعم الذكي:</b> تم استلام استفسارك يا أبو سلمان، النظام السيادي يعمل بكفاءة كاملة.</div>`;
        list.scrollTop = list.scrollHeight;
    }, 800);

    input.value = "";
    list.scrollTop = list.scrollHeight;
}

function logoutSystem() {
    if (confirm("هل تريد تسجيل الخروج من القلعة؟")) {
        document.getElementById('authGate').classList.remove('hidden');
    }
}
