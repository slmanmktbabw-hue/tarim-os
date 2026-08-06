/**
 * TARIM OS - النظام السيادي الإمبراطوري
 * ملف الجافاسكريبت المنفصل: app.js
 */

let currentStream = null;
let liveStream = null;
let facingMode = "environment";
let flashLightOn = false;
let timerInterval = null;
let liveLikes = 0;
let posts = JSON.parse(localStorage.getItem('tarim_posts') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    const createTab = document.getElementById('tab-create');
    if (createTab && createTab.classList.contains('active')) {
        initCamera();
    }
    renderFeed();
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

function switchTab(tab, btn){
    if(currentStream) { currentStream.getTracks().forEach(t => t.stop()); currentStream = null; }
    if(liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; }
    clearInterval(timerInterval);

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
    if(tab === 'home') renderFeed();
}

// تشغيل وتدوير الكاميرا في محطة الإنشاء
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

// التحكم بالفلاش (الإضاءة)
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
                showToast('⚠️ الفلاش غير مدعوم في هذا الجهاز أو الكاميرا');
            }
        } catch (err) {
            showToast('⚠️ تعذر التحكم بالفلاش');
        }
    };
}

const filterBtn = document.getElementById('filterBtn');
if(filterBtn) filterBtn.onclick = () => { showToast('✨ فلتر التجميل السيادي مفعل'); };

// رفع فيديو أو صورة وإضافتها للرئيسية مباشرة
const uploadVideo = document.getElementById('uploadVideo');
if(uploadVideo) {
    uploadVideo.onchange = (e) => {
        const file = e.target.files[0];
        if(file) {
            const url = URL.createObjectURL(file);
            posts.unshift({id: Date.now(), text: '📹 فيديو مرفوع: ' + file.name, videoUrl: url, likes: 0, comments: []});
            localStorage.setItem('tarim_posts', JSON.stringify(posts));
            showToast('🚀 تم رفع الفيديو ونشره في الرئيسية');
            switchTab('home', document.querySelectorAll('.nav-btn')[0]);
        }
    };
}

const uploadImage = document.getElementById('uploadImage');
if(uploadImage) {
    uploadImage.onchange = (e) => {
        const file = e.target.files[0];
        if(file) {
            const url = URL.createObjectURL(file);
            posts.unshift({id: Date.now(), text: '🖼️ صورة مرفوعة: ' + file.name, imageUrl: url, likes: 0, comments: []});
            localStorage.setItem('tarim_posts', JSON.stringify(posts));
            showToast('🚀 تم رفع الصورة ونشرها في الرئيسية');
            switchTab('home', document.querySelectorAll('.nav-btn')[0]);
        }
    };
}

// النشر النصي الفوري
const publishBtn = document.getElementById('publishBtn');
if(publishBtn) {
    publishBtn.onclick = () => {
        const input = document.getElementById('postContentInput');
        if(!input) return;
        const txt = input.value.trim();
        if(txt){
            posts.unshift({id: Date.now(), text: txt, likes: 0, comments: []});
            localStorage.setItem('tarim_posts', JSON.stringify(posts));
            input.value = '';
            showToast('🚀 تم النشر بنجاح');
            switchTab('home', document.querySelectorAll('.nav-btn')[0]);
        } else { 
            showToast('⚠️ يرجى كتابة وصف للمنشور أولاً'); 
        }
    };
}

// عرض المنشورات في الرئيسية
function renderFeed(){
    const feed = document.getElementById('feed');
    if(!feed) return;
    
    if(posts.length === 0){
        feed.innerHTML = `<div class="text-center text-slate-400 py-10"><div class="text-4xl mb-2">🎬</div><p class="text-xs">لم تنشر أي فيديوهات بعد</p><p class="text-[10px]">انشر أول بث مباشر أو منشور من زر +</p></div>`;
        return;
    }
    feed.innerHTML = posts.map(p => `
        <div class="glass p-3 rounded-2xl border border-cyan-500/20 space-y-2 text-right">
            <p class="text-xs text-white">${p.text}</p>
            ${p.videoUrl ? `<video src="${p.videoUrl}" controls class="w-full h-40 object-cover rounded-xl mt-2"></video>` : ''}
            ${p.imageUrl ? `<img src="${p.imageUrl}" class="w-full h-40 object-cover rounded-xl mt-2">` : ''}
            <div class="flex gap-4 text-xs pt-1 border-t border-slate-800 justify-end">
                <button onclick="likePost(${p.id})" class="text-cyan-400 hover:scale-105 transition cursor-pointer">❤️ ${p.likes}</button>
                <span class="text-slate-400">💬 ${p.comments.length} تعليقات</span>
            </div>
        </div>
    `).join('');
}

function likePost(id){
    posts = posts.map(p => p.id === id ? {...p, likes: p.likes + 1} : p);
    localStorage.setItem('tarim_posts', JSON.stringify(posts));
    renderFeed();
}

// شاشة البث المباشر الكاملة والتحكم بها
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

// زر البدء الفعلي بعد ظهور شاشة "البث السيادي جاهز"
const confirmStartLive = document.getElementById('confirmStartLive');
if(confirmStartLive) {
    confirmStartLive.onclick = () => {
        const readyBox = document.getElementById('readyToBroadcastBox');
        if(readyBox) readyBox.style.display = 'none';
        startTimer(480); // 8 دقائق
        showToast('🔴 بدأ البث المباشر السيادي بشاشة كاملة بنجاح');
    };
}

const liveBtn = document.getElementById('liveBtn');
if(liveBtn) liveBtn.onclick = startLiveStream;

const liveOpBtn = document.getElementById('liveOpBtn');
if(liveOpBtn) liveOpBtn.onclick = startLiveStream;

function endLive(){
    if(liveStream) liveStream.getTracks().forEach(t => t.stop());
    clearInterval(timerInterval);
    const liveScreen = document.getElementById('liveScreen');
    if(liveScreen) liveScreen.classList.add('hidden');
    showToast('⏰ انتهى البث المباشر السيادي');
}

const endLiveBtn = document.getElementById('endLiveBtn');
if(endLiveBtn) endLiveBtn.onclick = endLive;

function startTimer(s){
    let time = s;
    timerInterval = setInterval(() => {
        let m = Math.floor(time / 60).toString().padStart(2, '0');
        let sec = (time % 60).toString().padStart(2, '0');
        const timerDisplay = document.getElementById('liveTimer');
        if(timerDisplay) timerDisplay.innerText = `${m}:${sec}`;
        if(time <= 0){ endLive(); }
        time--;
    }, 1000);
}

// التفاعلات داخل شاشة البث (لايك، هدايا، تعليقات)
const likeLiveBtn = document.getElementById('likeBtn');
if(likeLiveBtn) {
    likeLiveBtn.onclick = () => {
        liveLikes++;
        const countSpan = document.getElementById('liveLikeCount');
        if(countSpan) countSpan.innerText = liveLikes;
        showToast('❤️ تم الإعجاب بالبث');
    };
}

const giftBtn = document.getElementById('giftBtn');
if(giftBtn) {
    giftBtn.onclick = () => {
        showToast('🎁 تم إرسال هدية إمبراطورية فاخرة للبث!');
    };
}

const beautyBtn = document.getElementById('beautyBtn');
if(beautyBtn) {
    beautyBtn.onclick = () => {
        showToast('✨ تم تفعيل فلتر التجميل المتقدم للبث');
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
