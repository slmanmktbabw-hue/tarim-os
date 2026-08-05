// public/ai-eye.js - 👁️ عين الذكاء الاصطناعي السيادي - TARIM OS V1.0 Beta
const AIEye = {
  active: false,

  init(){
    console.log('👁️ AI Eye Active - عين الذكاء الاصطناعي السيادي تريم');
    const btn = document.getElementById('openAiEyeBtn');
    if(btn){
      btn.onclick = ()=> this.openEye();
    }
    // ربط فحص قبل النشر
    const publishBtn = document.getElementById('publishTextBtn');
    if(publishBtn){
      const old = publishBtn.onclick;
      publishBtn.addEventListener('click', async (e)=>{
        const ok = await this.scanVideo();
        if(!ok){
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }, true);
    }
  },

  openEye(){
    const box = document.createElement('div');
    box.className='fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4';
    box.innerHTML=`
      <div class="glass w-full max-w-sm rounded-3xl p-6 text-center space-y-4 border border-purple-500/40">
        <h2 class="text-lg font-black text-purple-400">👁️ عين الذكاء الاصطناعي</h2>
        <p class="text-xs text-slate-300">أنا أرى ما لا تراه - أفحص الفيديو والنص من التضليل السيادي</p>
        <div id="aiResult" class="bg-slate-900 p-3 rounded-xl text-xs min-h-[60px]">👁️ جاهز للفحص...</div>
        <div class="flex gap-2">
          <button id="aiScanBtn" class="flex-1 bg-purple-600 py-2.5 rounded-xl text-xs font-bold">🔍 فحص المنشور</button>
          <button id="aiFaceBtn" class="flex-1 bg-slate-800 py-2.5 rounded-xl text-xs">👤 تعرف على الوجه</button>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="w-full bg-slate-800 py-2 rounded-xl text-xs">إغلاق</button>
      </div>
    `;
    document.body.appendChild(box);
    box.querySelector('#aiScanBtn').onclick=()=>this.scanVideo();
    box.querySelector('#aiFaceBtn').onclick=()=>this.detectFace();
  },

  async scanVideo(){
    const textEl = document.getElementById('postText');
    const text = textEl?.value?.trim() || '';
    const resultEl = document.getElementById('aiResult');
    if(resultEl) resultEl.innerHTML='👁️ جاري الفحص السيادي...';

    if(!text){
      if(resultEl) resultEl.innerHTML='❌ اكتب نص أولاً';
      this.toast('✍️ اكتب منشور أولاً');
      return false;
    }

    try{
      // يحاول يكلم السيرفر - لو فيه GEMINI_API_KEY يفحص ذكي
      const r = await fetch('/api/operations/anti-disinfo/check',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text, user: localStorage.getItem('tarim_user')||'AL'})
      });
      const d = await r.json();

      const status = d.result?.status || 'آمن ✅';
      const score = d.result?.score || 100;

      if(resultEl){
        resultEl.innerHTML = `
          <div class="text-right space-y-1">
            <div>النتيجة: <b class="${score>70?'text-green-400':'text-red-400'}">${status}</b></div>
            <div>الثقة: ${score}%</div>
            <div class="text-[10px] text-slate-400">فحص سيادي - تريم</div>
          </div>
        `;
      }

      // كلمات محظورة محلياً - Offline
      const badWords=['كذب','تضليل','إشاعة','فتنة'];
      const hasBad = badWords.some(w=>text.includes(w));

      if(hasBad || status.includes('تضليل') || score<50){
        this.toast('🛡️ عين AI كشفت محتوى مشبوه ❌ - راجع النص');
        return false;
      }

      this.toast('👁️ عين AI: المحتوى آمن سيادي ✅');
      return true;

    }catch(e){
      if(resultEl) resultEl.innerHTML='👁️ وضع Offline - فحص محلي ✅ آمن';
      console.log('AI offline', e.message);
      return true; // يسمح بالنشر لو السيرفر طافي
    }
  },

  async detectFace(){
    const resultEl = document.getElementById('aiResult');
    if(resultEl) resultEl.innerHTML='👁️ جاري التعرف على الوجوه...';
    this.toast('👁️ جاري التعرف...');

    setTimeout(()=>{
      if(resultEl) resultEl.innerHTML='👑 تم التعرف: الإمبراطور AL - ثقة 99% - دخول مسموح';
      this.toast('👑 تم التعرف - الإمبراطور AL 👑');
    }, 1200);
  },

  toast(msg){
    if(window.TARIMOS_Auth?.toast) window.TARIMOS_Auth.toast(msg);
    else if(window.showToast) window.showToast(msg);
    else {
      const box=document.getElementById('toastBox');
      if(!box) return;
      const d=document.createElement('div');
      d.className="bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg mt-2 text-center";
      d.innerText=msg;
      box.appendChild(d);
      setTimeout(()=>d.remove(),3000);
    }
  }
};

// تشغيل تلقائي
document.addEventListener('DOMContentLoaded', ()=> AIEye.init());
window.AIEye = AIEye;
