let currentStream = null;
let facingMode = "environment"; // env = خلفية, user = امامية

document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('tarim_user') === 'AL') {
        const authGate = document.getElementById('authGate');
        if(authGate) authGate.style.display = 'none';
        // تشغيل الكاميرا تلقائياً إذا كان المستخدم مسجلاً مسبقاً وكان في تبويب الإنشاء
        initCamera();
    }
});

function showToast(msg){
    const box = document.getElementById('toastBox');
    if(!box) return;
    const t = document.createElement('div');
    t.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg';
    t.innerText = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function forceUnlockCastle(){
    const authGate = document.getElementById('authGate');
    if(authGate) authGate.style.display = 'none';
    localStorage.setItem('tarim_user','AL');
    showToast('أهلاً بك يا أبو سلمان 👑');
    initCamera();
}

function switchTab(tab, btn){
    // ايقاف الكاميرا الحالية لمنع استهلاك الذاكرة
    if(currentStream){
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
    // اخفاء كل التابات
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    
    // اظهار التاب المطلوب
    const targetTab = document.getElementById('tab-' + tab);
    if(targetTab) targetTab.classList.add('active');
    
    // تلوين الزر النشط في الشريط السفلي
    document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('text-cyan-400'));
    if(btn) btn.classList.add('text-cyan-400');
    
    // تشغيل الكاميرا لو كان التاب هو الإنشاء
    if(tab === 'create') initCamera();
}

// ===== كود الكاميرا السيادية =====
async function initCamera(){
    const box = document.getElementById('cameraBox');
    if(!box) return;
    
    box.innerHTML = `<video id="cameraPreview" autoplay playsinline muted class="w-full h-full object-cover"></video>`;
    const video = document.getElementById('cameraPreview');
    
    if(currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
    }
    
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode === 'env' ? 'environment' : 'user' }
        });
        if(video) {
            video.srcObject = currentStream;
        }
    } catch(e) {
        console.error(e);
        showToast('⚠️ فشل تشغيل الكاميرا. تأكد من إذن الوصول واتصال HTTPS');
    }
}

// ربط الأزرار بأمان تام بعد تحميل المستند
document.addEventListener('DOMContentLoaded', () => {
    const switchBtn = document.getElementById('switchCamBtn');
    if(switchBtn) {
        switchBtn.onclick = () => {
            facingMode = facingMode === 'env' ? 'user' : 'env';
            initCamera();
            showToast(facingMode === 'user' ? '📷 كاميرا أمامية' : '📷 كاميرا خلفية');
        };
    }

    const frontBtn = document.getElementById('frontCamBtn');
    if(frontBtn) {
        frontBtn.onclick = () => {
            facingMode = 'user';
            initCamera();
            showToast('📷 كاميرا أمامية');
        };
    }

    const backBtn = document.getElementById('backCamBtn');
    if(backBtn) {
        backBtn.onclick = () => {
            facingMode = 'env';
            initCamera();
            showToast('📷 كاميرا خلفية');
        };
    }

    const liveBtn = document.getElementById('liveBtn');
    if(liveBtn) {
        liveBtn.onclick = () => {
            showToast('🔴 البث المباشر 8 دقائق - قادم في التحديث القادم');
        };
    }

    const publishBtn = document.getElementById('publishBtn');
    if(publishBtn) {
        publishBtn.onclick = () => {
            const input = document.getElementById('postContentInput');
            const txt = input ? input.value.trim() : "";
            if(txt !== ""){ 
                showToast('🚀 تم النشر بنجاح في القلعة السيادية');
                if(input) input.value = "";
            } else {
                showToast('⚠️ يرجى كتابة وصف للمنشور أولاً');
            }
        };
    }
});
