let currentStream = null;
let facingMode = "environment"; // env = خلفية, user = امامية

document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('tarim_user')) {
        const authGate = document.getElementById('authGate');
        if(authGate) authGate.style.display = 'none';
        initCamera();
    }
});

function showToast(msg){
    const box = document.getElementById('toastBox');
    if(!box) return;
    const t = document.createElement('div');
    t.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl mb-2 text-xs font-bold text-center shadow-lg';
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
    if(currentStream){ 
        currentStream.getTracks().forEach(t => t.stop()); 
        currentStream = null; 
    }
    document.querySelectorAll('.tab-content').forEach(x => x.classList.add('hidden'));
    const targetTab = document.getElementById('tab-' + tab);
    if(targetTab) targetTab.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('text-cyan-400'));
    if(btn) btn.classList.add('text-cyan-400');
    
    if(tab === 'create') initCamera();
}

// ===== كود الكاميرا =====
async function initCamera(){
    const box = document.getElementById('cameraBox');
    if(!box) return;
    
    if(!document.getElementById('cameraPreview')){
        box.innerHTML = `<video id="cameraPreview" autoplay playsinline muted class="w-full h-full object-cover"></video>`;
    }
    const video = document.getElementById('cameraPreview');
    if(currentStream) currentStream.getTracks().forEach(t => t.stop());
    
    try {
        // تصحيح معامل facingMode ليتوافق مع الـ API بشكل صحيح
        const constraints = {
            video: { facingMode: facingMode === 'env' ? { exact: 'environment' } : 'user' }
        };
        
        // محاولة البدء بالوضع المحدد، وفي حال فشل الـ exact يتم العرض بشكل مرن
        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch(err) {
            currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode === 'env' ? 'environment' : 'user' } });
        }
        
        if(video) {
            video.srcObject = currentStream;
        }
    } catch(e) {
        console.error(e);
        showToast('⚠️ تم رفض صلاحية الكاميرا أو أن الاتصال ليس HTTPS');
    }
}

// ربط الأزرار والأحداث البرمجية للتطبيق
document.addEventListener('DOMContentLoaded', () => {
    const switchBtn = document.getElementById('switchCamBtn');
    if(switchBtn) {
        switchBtn.addEventListener('click', () => {
            facingMode = facingMode === 'env' ? 'user' : 'env'; 
            initCamera();
            showToast(facingMode === 'user' ? '📷 كاميرا أمامية' : '📷 كاميرا خلفية');
        });
    }

    const frontBtn = document.getElementById('frontCamBtn');
    if(frontBtn) {
        frontBtn.addEventListener('click', () => {
            facingMode = 'user'; 
            initCamera();
            showToast('📷 كاميرا أمامية');
        });
    }

    const backBtn = document.getElementById('backCamBtn');
    if(backBtn) {
        backBtn.addEventListener('click', () => {
            facingMode = 'env'; 
            initCamera();
            showToast('📷 كاميرا خلفية');
        });
    }

    const liveBtn = document.getElementById('liveBtn');
    if(liveBtn) {
        liveBtn.addEventListener('click', () => {
            showToast('🔴 البث 8 دقائق قادم قريبًا');
        });
    }

    const publishBtn = document.getElementById('publishBtn');
    if(publishBtn) {
        publishBtn.addEventListener('click', () => {
            const input = document.getElementById('postContentInput');
            if(input && input.value.trim() !== ""){
                showToast('🚀 تم النشر بنجاح في القلعة');
                input.value = "";
            } else {
                showToast('⚠️ يرجى كتابة وصف أولاً');
            }
        });
    }
});

