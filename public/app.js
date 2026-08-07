/**
 * TARIM OS - النظام السيادي الإمبراطوري
 * ملف الجافاسكريبت الرئيسي: app.js
 */

let currentStream = null;
let liveStream = null;
let facingMode = "environment";
let flashLightOn = false;
let liveLikes = 0;
let mainLikes = 120;
let mapInstance = null;
let posts = JSON.parse(localStorage.getItem('tarim_posts') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    const createTab = document.getElementById('tab-create');
    if (createTab && createTab.classList.contains('active')) {
        initCamera();
    }
});

function showToast(msg){
    const box = document.getElementById('toastBox');
    if(!box) return;
    const t = document.createElement('div');
    t.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg mb-2 text-center';
    t.innerText = msg; 
    box.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function loginSystem() {
    const user = document.getElementById('loginUser').value;
    if(user.trim() !== '') {
        const authScreen = document.getElementById('authScreen');
        if(authScreen) authScreen.style.display = 'none';
        showToast('🛡️ تم التحقق بنجاح، أهلاً بك يا إمبراطور AL');
    } else {
        showToast('⚠️ يرجى إدخال اسم المستخدم');
    }
}

function loginWithGoogle() {
    const authScreen = document.getElementById('authScreen');
    if(authScreen) authScreen.style.display = 'none';
    showToast('🌐 تم تسجيل الدخول عبر حساب Google السيادي بنجاح');
}

function switchTab(tab, btn){
    if(currentStream) { currentStream.getTracks().forEach(t => t.stop()); currentStream = null; }
    if(liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; }

    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    const targetTab = document.getElementById('tab-' + tab);
    if(targetTab) targetTab.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(x => {
        const spanText = x.querySelectorAll('span')[1];
        if(spanText) spanText.classList.remove('text-cyan-400');
        x.classList.remove('text-cyan-400');
        x.classList.add('text-slate-400');
    });
    
    if(btn) {
        btn.classList.remove('text-slate-400');
        btn.classList.add('text-cyan-400');
        const spanText = btn.querySelectorAll('span')[1];
        if(spanText) spanText.classList.add('text-cyan-400');
    }

    if(tab === 'create') initCamera();
}

async function initCamera(){
    const preview = document.getElementById('cameraPreview');
    if(!preview) return;
    try{
        if(currentStream) {
            currentStream.getTracks().forEach(t => t.stop());
        }
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode === 'env' ? 'environment' : 'user' },
            audio: true
        });
        preview.srcObject = currentStream;
    }catch(e){ 
        console.error(e);
        showToast('⚠️ يرجى السماح بصلاحيات الكاميرا والميكروفون'); 
    }
}

const switchCamBtn = document.getElementById('switchCamBtn');
if(switchCamBtn) {
    switchCamBtn.onclick = () => { 
        facingMode = facingMode === 'env' ? 'user' : 'env'; 
        initCamera(); 
        showToast(facingMode === 'user' ? '🔄 تم التبديل للكاميرا الأمامية' : '🔄 تم التبديل للكاميرا الخلفية');
    };
}

const lightBtn = document.getElementById('lightBtn');
if(lightBtn) {
    lightBtn.onclick = async () => {
        if(!currentStream) return;
        const track = currentStream.getVideoTracks()[0];
        try {
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
                flashLightOn = !flashLightOn;
                await track.applyConstraints({ advanced: [{ torch: flashLightOn }] });
                showToast(flashLightOn ? '💡 تم تشغيل الفلاش' : '💡 تم إيقاف الفلاش');
            } else {
                showToast('⚠️ الفلاش غير مدعوم في هذا الجهاز');
            }
        } catch (err) {
            showToast('⚠️ تعذر التحكم بالفلاش');
        }
    };
}

const filterBtn = document.getElementById('filterBtn');
if(filterBtn) filterBtn.onclick = () => { showToast('✨ فلتر التجميل السيادي مفعل'); };

const publishBtn = document.getElementById('publishBtn');
if(publishBtn) {
    publishBtn.onclick = () => {
        const input = document.getElementById('postContentInput');
        if(!input) return;
        const txt = input.value.trim();
        if(txt){
            input.value = '';
            showToast('🚀 تم نشر الفيديو على السيرفرات المركزية بنجاح');
            switchTab('home', document.querySelectorAll('.nav-btn')[0]);
        } else { 
            showToast('⚠️ يرجى كتابة وصف المنشور أولاً'); 
        }
    };
}

function likeMainPost(){
    mainLikes++;
    const countEl = document.getElementById('mainLikeCount');
    if(countEl) countEl.innerText = mainLikes;
    showToast('❤️ تم تسجيل الإعجاب');
}

async function startLiveStream() {
    const liveScreen = document.getElementById('liveScreen');
    const readyBox = document.getElementById('readyToBroadcastBox');
    if(liveScreen) liveScreen.classList.remove('hidden');
    if(readyBox) readyBox.style.display = 'block';
    
    try {
        liveStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        const liveVideo = document.getElementById('liveVideo');
        if(liveVideo) liveVideo.srcObject = liveStream;
    } catch(err) {
        console.error(err);
        showToast('⚠️ تعذر تشغيل الكاميرا للبث');
    }
}

const confirmStartLive = document.getElementById('confirmStartLive');
if(confirmStartLive) {
    confirmStartLive.onclick = () => {
        const readyBox = document.getElementById('readyToBroadcastBox');
        if(readyBox) readyBox.style.display = 'none';
        showToast('🔴 بدأ البث المباشر السيادي بشاشة كاملة');
    };
}

const liveBtn = document.getElementById('liveBtn');
if(liveBtn) liveBtn.onclick = startLiveStream;

const liveOpBtn = document.getElementById('liveOpBtn');
if(liveOpBtn) liveOpBtn.onclick = startLiveStream;

function endLive(){
    if(liveStream) liveStream.getTracks().forEach(t => t.stop());
    const liveScreen = document.getElementById('liveScreen');
    if(liveScreen) liveScreen.classList.add('hidden');
    showToast('⏰ تم إنهاء البث المباشر');
}

const endLiveBtn = document.getElementById('endLiveBtn');
if(endLiveBtn) endLiveBtn.onclick = endLive;

const likeLiveBtn = document.getElementById('likeBtn');
if(likeLiveBtn) {
    likeLiveBtn.onclick = () => {
        liveLikes++;
        const countSpan = document.getElementById('liveLikeCount');
        if(countSpan) countSpan.innerText = liveLikes;
        showToast('❤️ تم الإعجاب');
    };
}

const giftBtn = document.getElementById('giftBtn');
if(giftBtn) {
    giftBtn.onclick = () => {
        showToast('🎁 تم إرسال هدية إمبراطورية!');
    };
}

const beautyBtn = document.getElementById('beautyBtn');
if(beautyBtn) {
    beautyBtn.onclick = () => {
        showToast('✨ فلتر التجميل مفعل');
    };
}

const sendCommentBtn = document.getElementById('sendCommentBtn');
const commentInput = document.getElementById('commentInput');

function handleSendComment() {
    if(commentInput && commentInput.value.trim() !== ''){
        const commentsContainer = document.getElementById('comments');
        if(commentsContainer){
            const c = document.createElement('div');
            c.className = 'bg-black/70 px-3 py-1.5 rounded-xl mb-1 text-xs text-cyan-200 border border-cyan-500/30 text-right';
            c.innerText = 'AL: ' + commentInput.value.trim();
            commentsContainer.appendChild(c);
            commentsContainer.scrollTop = commentsContainer.scrollHeight;
        }
        commentInput.value = '';
        showToast('💬 تم إرسال التعليق');
    }
}

if(sendCommentBtn) sendCommentBtn.onclick = handleSendComment;
if(commentInput){
    commentInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') handleSendComment();
    });
}

function openAiBot() {
    switchTab('inbox', document.querySelectorAll('.nav-btn')[3]);
    showToast('🤖 تم تفعيل روبوت عين الذكاء المساعد');
}

function openSupportBot() {
    switchTab('inbox', document.querySelectorAll('.nav-btn')[3]);
    showToast('🛡️ تم فتح قناة فريق الدعم الفني السيادي');
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const chat = document.getElementById('chatMessages');
    if(input && input.value.trim() !== '' && chat) {
        const userMsg = document.createElement('div');
        userMsg.className = 'bg-slate-800 p-2 rounded-xl text-white max-w-[80%] mr-auto text-left';
        userMsg.innerText = input.value;
        chat.appendChild(userMsg);

        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'bg-cyan-950/60 p-2 rounded-xl text-cyan-200 border border-cyan-500/30 max-w-[80%]';
            botMsg.innerText = '🤖 عين الذكاء: تم استلام رسالتك وتأمين النظام على tarimos.org بنجاح!';
            chat.appendChild(botMsg);
            chat.scrollTop = chat.scrollHeight;
        }, 800);

        input.value = '';
        chat.scrollTop = chat.scrollHeight;
    }
}

function subscribePayPal() {
    const paypalURL = "https://www.paypal.com";
    showToast('💳 جاري تحويلك إلى بوابة PayPal الآمنة...');
    setTimeout(() => {
        window.open(paypalURL, '_blank');
    }, 1000);
}

const offlineMapBtn = document.getElementById('offlineMapBtn');
const mapScreen = document.getElementById('mapScreen');
const closeMapBtn = document.getElementById('closeMapBtn');

if(offlineMapBtn) {
    offlineMapBtn.onclick = () => {
        if(mapScreen) mapScreen.classList.remove('hidden');
        setTimeout(() => {
            if(!mapInstance) {
                mapInstance = L.map('mapContainer').setView([16.0508, 48.9958], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: 'TARIM OS Offline Map'
                }).addTo(mapInstance);
                L.marker([16.0508, 48.9958]).addTo(mapInstance)
                    .bindPopup('<b>تريم السيادية</b><br>مركز العمليات الإمبراطورية.')
                    .openPopup();
            } else {
                mapInstance.invalidateSize();
            }
        }, 150);
        showToast('🗺️ تم فتح خريطة حضرموت السيادية');
    };
}

if(closeMapBtn) {
    closeMapBtn.onclick = () => {
        if(mapScreen) mapScreen.classList.add('hidden');
        showToast('🔒 تم إغلاق الخريطة');
    };
}

