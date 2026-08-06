let currentStream = null;
let liveStream = null;
let facingMode = "environment";
let timerInterval = null;
let posts = JSON.parse(localStorage.getItem('tarim_posts') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    // تشغيل الكاميرا تلقائياً إذا كان المستخدم في تبويب الإنشاء عند التحميل
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

function switchTab(tab, btn){
    if(currentStream) { currentStream.getTracks().forEach(t => t.stop()); currentStream = null; }
    if(liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; }
    clearInterval(timerInterval);

    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    const targetTab = document.getElementById('tab-' + tab);
    if(targetTab) targetTab.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(x => {
        const span = x.querySelector('span:not(.text-2xl)');
        if(span) span.classList.remove('text-cyan-400');
    });
    
    if(btn) {
        const span = btn.querySelector('span:not(.text-2xl)');
        if(span) span.classList.add('text-cyan-400');
    }

    if(tab === 'create') initCamera();
    if(tab === 'home') renderFeed();
}

// الكاميرا المصغرة
async function initCamera(){
    const box = document.getElementById('cameraBox');
    if(!box) return;
    box.innerHTML = `<video id="cameraPreview" autoplay playsinline muted class="w-full h-full object-cover"></video>`;
    try{
        currentStream = await navigator.mediaDevices.getUserMedia({video:{facingMode: facingMode === 'env' ? 'environment' : 'user'}});
        const preview = document.getElementById('cameraPreview');
        if(preview) preview.srcObject = currentStream;
    }catch(e){ 
        console.error(e);
        showToast('⚠️ فشل تشغيل الكاميرا (تحقق من الصلاحيات أو HTTPS)'); 
    }
}

const switchCamBtn = document.getElementById('switchCamBtn');
if(switchCamBtn) {
    switchCamBtn.onclick = () => { 
        facingMode = facingMode === 'env' ? 'user' : 'env'; 
        initCamera(); 
        showToast(facingMode === 'user' ? '📷 كاميرا أمامية' : '📷 كاميرا خلفية');
    };
}

const filterBtn = document.getElementById('filterBtn');
if(filterBtn) filterBtn.onclick = () => { showToast('✨ فلتر تجميل مفعل'); };

const lightBtn = document.getElementById('lightBtn');
if(lightBtn) lightBtn.onclick = () => { showToast('💡 إضاءة مفعلة'); };

// النشر - يحفظ في الرئيسية
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
            
            // التوجيه تلقائياً للرئيسية
            const homeNavBtn = document.querySelectorAll('.nav-btn')[4];
            switchTab('home', homeNavBtn);
        } else { 
            showToast('⚠️ يرجى كتابة وصف للمنشور أولاً'); 
        }
    };
}

// عرض الفيديوهات والمنشورات في الرئيسية
function renderFeed(){
    const feed = document.getElementById('feed');
    if(!feed) return;
    
    if(posts.length === 0){
        feed.innerHTML = `<div class="text-center text-slate-400 py-10"><div class="text-4xl mb-2">🎬</div><p class="text-xs">لم تنشر أي فيديوهات بعد</p><p class="text-[10px]">انشر أول بث مباشر أو منشور من زر +</p></div>`;
        return;
    }
    feed.innerHTML = posts.map(p => `
        <div class="glass p-3 rounded-2xl border border-cyan-500/20 space-y-2">
            <p class="text-xs text-white">${p.text}</p>
            <div class="flex gap-4 text-xs pt-1 border-t border-slate-800">
                <button onclick="likePost(${p.id})" class="text-cyan-400 hover:scale-105 transition">❤️ ${p.likes}</button>
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

// البث المباشر السيادي (8 دقائق)
async function startLiveStream() {
    const liveScreen = document.getElementById('liveScreen');
    if(liveScreen) liveScreen.classList.remove('hidden');
    
    try {
        liveStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        const liveVideo = document.getElementById('liveVideo');
        if(liveVideo) liveVideo.srcObject = liveStream;
        startTimer(480); // 8 دقائق
        showToast('🔴 بدأ البث المباشر السيادي بنجاح');
    } catch(err) {
        console.error(err);
        showToast('⚠️ تعذر تشغيل البث، تحقق من إذن الكاميرا والميكروفون');
        if(liveScreen) liveScreen.classList.add('hidden');
    }
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
    showToast('⏰ انتهى البث المباشر');
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
        
        if(time <= 0){ 
            endLive(); 
        }
        time--;
    }, 1000);
}

// تفاعلات شاشة البث
const likeLiveBtn = document.getElementById('likeBtn');
if(likeLiveBtn) likeLiveBtn.onclick = () => { showToast('❤️ تفاعل إعجاب سيادي'); };

const giftBtn = document.getElementById('giftBtn');
if(giftBtn) giftBtn.onclick = () => { showToast('🎁 تم إرسال هدية إمبراطورية!'); };

const beautyBtn = document.getElementById('beautyBtn');
if(beautyBtn) beautyBtn.onclick = () => { showToast('✨ فلتر التجميل مفعل'); };

const commentInput = document.getElementById('commentInput');
if(commentInput){
    commentInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && e.target.value.trim() !== ''){
            const commentsContainer = document.getElementById('comments');
            if(commentsContainer){
                const c = document.createElement('div');
                c.className = 'bg-black/60 px-2.5 py-1 rounded-lg mb-1 text-xs text-cyan-200 border border-cyan-500/20';
                c.innerText = 'AL: ' + e.target.value;
                commentsContainer.appendChild(c);
                commentsContainer.scrollTop = commentsContainer.scrollHeight;
            }
            e.target.value = '';
        }
    });
                    }
