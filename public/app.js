// public/app.js - TARIM OS V1 FINAL - STABLE
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
    // نشغل الكاميرا لو المستخدم فاتح على تبويب الإنشاء
    if(document.getElementById('tab-create') && !document.getElementById('tab-create').classList.contains('hidden')){
        setTimeout(startCamera, 300);
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
    // ايقاف الكاميرا لو خرجنا من تبويب الإنشاء
    if(currentStream && tabName !== 'create'){
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

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
    if (tabName === 'create') setTimeout(startCamera, 300); // تشغيل الكاميرا
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

let mapInstance = null;
const mapBtn = document.getElementById('opMapBtn');
if (mapBtn) {
    mapBtn.addEventListener('click', () => {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;
        mapContainer.classList.toggle('hidden');
        if (!mapContainer.classList.contains('hidden') && !mapInstance) {
            setTimeout(() => {
                if (typeof L !== 'undefined') {
                    mapInstance = L.map('mapContainer').setView([16.0355, 48.9856], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInstance);
                    L.marker([16.0355, 48.9856]).addTo(mapInstance).bindPopup('<b>تريم - حضرموت الخير</b> 🌴').openPopup();
                }
            }, 300);
        }
    });
}

const qrBtn = document.getElementById('opQrBtn');
if (qrBtn) {
    qrBtn.addEventListener('click', () => {
        const qrBox = document.getElementById('operationsQrBox');
        if (!qrBox) return;
        qrBox.classList.toggle('hidden');
        if (!qrBox.classList.contains('hidden')) {
            qrBox.innerHTML = "";
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrBox, { text: "TARIM-OS-SECURE-SEAL-AL", width: 90, height: 90 });
            }
            showToast('🧾 تم إصدار وختم QR السيادي');
        }
    });
}

const publishBtn = document.getElementById('publishTextBtn');
if (publishBtn) {
    publishBtn.addEventListener('click', () => {
        const input = document.getElementById('postContentInput');
        if (input && input.value.trim() !== "") {
            input.value = "";
            switchTab('home', document.querySelector('.nav-btn'));
            showToast('🚀 تم النشر الفوري بنجاح في القلعة الرئيسية!');
        } else {
            showToast('⚠️ يرجى كتابة وصف للمنشور أولاً');
        }
    });
}

const sendMsgBtn = document.getElementById('sendInboxMsgBtn');
if (sendMsgBtn) {
    sendMsgBtn.addEventListener('click', () => {
        const input = document.getElementById('inboxInputField');
        const list = document.getElementById('inboxMessagesList');
        if (input && list && input.value.trim() !== "") {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'bg-cyan-500/20 border-cyan-500/30 p-2.5 rounded-lg text-xs text-cyan-200 mt-2 text-right';
            msgDiv.innerText = input.value;
            list.appendChild(msgDiv);
            input.value = "";
            showToast('✉️ تم إرسال الرسالة السيادية');
        }
    });
}

// ===== كود الكاميرا السيادية =====
let currentStream = null;
let facingMode = "environment"; // environment = خلفية, user = امامية

const video = document.getElementById('cameraPreview');
const switchBtn = document.getElementById('switchCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const capturedImg = document.getElementById('capturedImage');

async function startCamera() {
    if (!video) return;
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
        });
        video.srcObject = currentStream;
    } catch (err) {
        showToast('⚠️ لم يتم السماح بالوصول للكاميرا');
        console.error(err);
    }
}

// تبديل الكاميرا
if (switchBtn) {
    switchBtn.addEventListener('click', () => {
        facingMode = facingMode === "environment" ? "user" : "environment";
        startCamera();
        showToast(facingMode === "user" ? '📷 الكاميرا الامامية' : '📷 الكاميرا الخلفية');
    });
}

// التقاط صورة
if (captureBtn) {
    captureBtn.addEventListener('click', () => {
        if(!video || !video.videoWidth) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        capturedImg.src = dataUrl;
        capturedImg.classList.remove('hidden');
        showToast('✅ تم التقاط الصورة');
    });
}
