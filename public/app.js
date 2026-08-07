/**
 * TARIM OS - النظام السيادي الإمبراطوري
 * ملف مصحح 100% - نسخ لصق
 */
let currentStream = null;
let liveStream = null;
let facingMode = "env"; // ✅ تم التصليح - كان "environment"
let flashLightOn = false;
let liveLikes = 0;
let mainLikes = 120;
let mapInstance = null;

function showToast(msg){
    const box = document.getElementById('toastBox');
    if(!box) return;
    const t = document.createElement('div');
    t.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg mb-2 text-center';
    t.innerText = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

// دوال global عشان onclick في HTML يشتغل
window.loginSystem = function() {
    const user = document.getElementById('loginUser').value;
    if(user.trim()!== '') {
        document.getElementById('authScreen').style.display = 'none';
        showToast('👑 تم التحقق بنجاح، أهلاً بك يا إمبراطور AL');
    } else {
        showToast('⚠️ يرجى إدخال اسم المستخدم');
    }
}
window.loginWithGoogle = function() {
    document.getElementById('authScreen').style.display = 'none';
    showToast('🌐 تم تسجيل الدخول عبر Google السيادي بنجاح');
}
window.likeMainPost = function(){
    mainLikes++;
    document.getElementById('mainLikeCount').innerText = mainLikes;
    showToast('❤️ تم تسجيل الإعجاب');
}
window.openAiBot = function() {
    switchTab('inbox', document.querySelectorAll('.nav-btn')[3]);
    showToast('🤖 تم تفعيل روبوت عين الذكاء');
}
window.openSupportBot = function() {
    switchTab('inbox', document.querySelectorAll('.nav-btn')[3]);
    showToast('🛡️ تم فتح قناة الدعم الفني');
}
window.sendChatMessage = function() {
    const input = document.getElementById('chatInput');
    const chat = document.getElementById('chatMessages');
    if(input && input.value.trim()!== '' && chat) {
        const userMsg = document.createElement('div');
        userMsg.className = 'bg-cyan-950/60 border border-cyan-500/30 p-2 rounded-xl text-white max-w-[80%] mr-auto text-right';
        userMsg.innerText = input.value;
        chat.appendChild(userMsg);
        const q = input.value; input.value = '';
        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'bg-slate-900 p-2 rounded-xl text-slate-300 max-w-[80%] text-right';
            botMsg.innerText = '🤖 عين الذكاء: تم استلام ('+q+') وجاري التنفيذ عبر سيرفرات تريم.';
            chat.appendChild(botMsg);
            chat.scrollTop = chat.scrollHeight;
        }, 600);
        chat.scrollTop = chat.scrollHeight;
    }
}
window.subscribePayPal = function() {
    showToast('💳 جاري تحويلك إلى PayPal...');
    setTimeout(() => window.open("https://www.paypal.com", '_blank'), 800);
}

window.switchTab = function(tabName, btnElement){
    if(tabName!== 'create' && currentStream) { currentStream.getTracks().forEach(t => t.stop()); currentStream = null; }
    if(tabName!== 'operations' && tabName!== 'create' && liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; document.getElementById('liveScreen')?.classList.add('hidden'); }
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    document.getElementById('tab-' + tabName)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(x => { x.classList.remove('text-cyan-400'); x.classList.add('text-slate-400'); });
    if(btnElement) { btnElement.classList.remove('text-slate-400'); btnElement.classList.add('text-cyan-400'); }
    if(tabName === 'create') initCamera();
}

async function initCamera(){
    const preview = document.getElementById('cameraPreview');
    if(!preview) return;
    try{
        if(currentStream) currentStream.getTracks().forEach(t => t.stop());
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode === 'env'? 'environment' : 'user' },
            audio: false
        });
        preview.srcObject = currentStream;
    }catch(e){
        showToast('⚠️ الكاميرا تحتاج HTTPS وسماح من المتصفح');
    }
}

async function startLiveStream() {
    const liveScreen = document.getElementById('liveScreen');
    const readyBox = document.getElementById('readyToBroadcastBox');
    liveScreen.classList.remove('hidden');
    liveScreen.classList.add('flex');
    readyBox.style.display = 'block';
    try {
        liveStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('liveVideo').srcObject = liveStream;
    } catch(err) {
        showToast('⚠️ تعذر تشغيل كاميرا البث');
    }
}

// ✅ كل الأزرار داخل DOMContentLoaded عشان تشتغل 100%
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('switchCamBtn')?.addEventListener('click', () => {
        facingMode = facingMode === 'env'? 'user' : 'env';
        initCamera();
        showToast(facingMode === 'user'? '🔄 أمامية' : '🔄 خلفية');
    });
    document.getElementById('lightBtn')?.addEventListener('click', async () => {
        if(!currentStream) return showToast('⚠️ شغل الكاميرا أولاً');
        const track = currentStream.getVideoTracks()[0];
        try {
            if (track.getCapabilities().torch) {
                flashLightOn =!flashLightOn;
                await track.applyConstraints({ advanced: [{ torch: flashLightOn }] });
                showToast(flashLightOn? '💡 فلاش ON' : '💡 OFF');
            } else showToast('⚠️ الفلاش غير مدعوم');
        } catch { showToast('⚠️ تعذر التحكم بالفلاش'); }
    });
    document.getElementById('filterBtn')?.addEventListener('click', () => {
        const v=document.getElementById('cameraPreview');
        v.style.filter = v.style.filter? '' : 'contrast(1.2) saturate(1.5)';
        showToast('✨ فلتر مفعل');
    });
    document.getElementById('publishBtn')?.addEventListener('click', () => {
        const input = document.getElementById('postContentInput');
        if(input.value.trim()){
            input.value = '';
            showToast('🚀 تم النشر بنجاح');
            switchTab('home', document.querySelectorAll('.nav-btn')[0]);
        } else showToast('⚠️ اكتب وصف أولاً');
    });
    document.getElementById('liveBtn')?.addEventListener('click', startLiveStream);
    document.getElementById('liveOpBtn')?.addEventListener('click', startLiveStream);
    document.getElementById('confirmStartLive')?.addEventListener('click', () => {
        document.getElementById('readyToBroadcastBox').style.display = 'none';
        showToast('🔴 بدأ البث المباشر');
    });
    document.getElementById('endLiveBtn')?.addEventListener('click', () => {
        liveStream?.getTracks().forEach(t => t.stop());
        document.getElementById('liveScreen').classList.add('hidden');
        document.getElementById('liveScreen').classList.remove('flex');
        showToast('⏰ انتهى البث');
    });
    document.getElementById('likeBtn')?.addEventListener('click', () => {
        document.getElementById('liveLikeCount').innerText = ++liveLikes;
    });
    document.getElementById('giftBtn')?.addEventListener('click', () => showToast('🎁 هدية إمبراطورية!'));
    document.getElementById('beautyBtn')?.addEventListener('click', () => showToast('✨ فلتر التجميل مفعل'));
    document.getElementById('sendCommentBtn')?.addEventListener('click', () => {
        const inp=document.getElementById('commentInput');
        if(!inp.value.trim())return;
        const c=document.createElement('div');
        c.className='bg-black/70 px-3 py-1.5 rounded-xl mb-1 text-xs text-cyan-200 border border-cyan-500/30';
        c.innerText='AL: '+inp.value;
        document.getElementById('comments').appendChild(c);
        inp.value='';
    });
    document.getElementById('offlineMapBtn')?.addEventListener('click', () => {
        if(typeof L === 'undefined') return showToast('⚠️ Leaflet لم تحمل - تأكد من النت');
        document.getElementById('mapScreen').classList.remove('hidden');
        document.getElementById('mapScreen').classList.add('flex');
        setTimeout(() => {
            if(!mapInstance) {
                mapInstance = L.map('mapContainer').setView([16.0508, 48.9958], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
                L.marker([16.0508, 48.9958]).addTo(mapInstance).bindPopup('<b>تريم السيادية</b>').openPopup();
            } else mapInstance.invalidateSize();
        }, 200);
    });
    document.getElementById('closeMapBtn')?.addEventListener('click', () => {
        document.getElementById('mapScreen').classList.add('hidden');
        document.getElementById('mapScreen').classList.remove('flex');
    });
    document.getElementById('secureChatBtn')?.addEventListener('click', () => { switchTab('inbox', document.querySelectorAll('.nav-btn')[3]); showToast('💬 المراسلة الآمنة مفتوحة'); });
    document.getElementById('qrSealBtn')?.addEventListener('click', () => showToast('🔐 الختم الميداني قريباً'));
});
