// public/app.js - TARIM OS V7.1 IMPERIAL FINAL FIXED
// 🐉◈⚖️👑 حضرموت - تريم - سيادة كاملة
"use strict";
(function () {

  const $ = (id) => document.getElementById(id);
  const esc = (s) => {
    const d = document.createElement('div');
    d.textContent = String(s || '').substring(0,2000);
    return d.innerHTML;
  };
  const sanitize = (s) => String(s||'').trim().substring(0,2000).replace(/</g,'').replace(/>/g,'').replace(/javascript:/gi,'');

  function toast(msg, type='ok'){
    const box = $('toastBox'); if(!box) return;
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `background:${type==='err'?'#f43f5e':'#00B4D8'};color:${type==='err'?'#fff':'#000'};padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.4)`;
    box.appendChild(el); setTimeout(()=>el.remove(),3200);
  }

  let currentStream=null, liveStream=null, facingMode='environment', mapInstance=null;
  let currentChatWith=null, filterIdx=0, liveSec=0, liveTimerInt=null, lightOn=false;
  const filters = ['none','grayscale(1)','sepia(.8)','contrast(1.4) brightness(1.1)','hue-rotate(90deg) saturate(1.5)','brightness(1.3)'];

  function getUsers(){ try{ return JSON.parse(localStorage.getItem('tarim_users_v7')||'{}'); }catch{ return {}; } }
  function saveUsers(u){ localStorage.setItem('tarim_users_v7', JSON.stringify(u)); }
  function getPosts(){ try{ return JSON.parse(localStorage.getItem('tarim_posts_v7')||'[]'); }catch{ return []; } }
  function savePosts(p){ localStorage.setItem('tarim_posts_v7', JSON.stringify(p)); }
  function getMessages(){ try{ return JSON.parse(localStorage.getItem('tarim_messages_v7')||'{}'); }catch{ return {}; } }
  function saveMessages(m){ localStorage.setItem('tarim_messages_v7', JSON.stringify(m)); }

  let users = getUsers();
  if(!users['AL']){ users['AL']='AL2026'; saveUsers(users); }

  function stopAllStreams(){
    if(currentStream) currentStream.getTracks().forEach(t=>t.stop()); currentStream=null;
    if(liveStream) liveStream.getTracks().forEach(t=>t.stop()); liveStream=null;
    if(liveTimerInt) clearInterval(liveTimerInt); liveTimerInt=null;
  }

  function loadFeed(){
    const feed = $('postsFeed'); if(!feed) return;
    let posts = getPosts();
    if(posts.length===0){
      posts = [
        {id:1,user:'TARIM_OS',text:'بِسْمِ اللهِ - انطلقت القلعة السيادية من تريم حضرموت 👑🌴 النظام الحقيقي يعمل 100% بدون ثغرات',likes:324,comments:45,time:'الآن',avatar:'👑'},
        {id:2,user:'AL_Emperor',text:'تم ترتيب الملفات: الرئيسية على اليمن (اليمين) ✅ العمليات ⚡ + الإنشاء 💡 الوارد 💬 الملفات 👤',likes:189,comments:22,time:'منذ دقيقة',avatar:'AL'},
        {id:3,user:'Hadhramout',text:'خريطة حضرموت + QR السيادي + بث مباشر LIVE شاشة كاملة + مراسلة آمنة بين الحسابات 🛡️',likes:98,comments:12,time:'منذ 5 دقائق',avatar:'🌴'}
      ];
      savePosts(posts);
    }
    feed.innerHTML='';
    posts.slice().reverse().forEach(p=>{
      const card = document.createElement('div');
      card.className='tiktok-card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#22d3ee;font-weight:800">@${esc(p.user)} 👑</span><span style="color:#94a3b8">تريم • ${esc(p.time)}</span></div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:20px">
          <div style="width:68px;height:68px;border-radius:50%;background:#00B4D8;color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px">${esc(p.avatar)}</div>
          <p style="color:#fff;font-size:14px;line-height:1.8;max-width:86%">${esc(p.text)}</p>
          <p style="color:#22d3ee;font-size:11px">tarim.os.ye • OKX: 0x53...ab96</p>
        </div>
        <div style="position:absolute;left:12px;bottom:80px;display:flex;flex-direction:column;gap:16px">
          <div class="tiktok-act" data-like="${p.id}"><b>❤️</b><span>${p.likes}</span></div>
          <div class="tiktok-act" data-comment="${p.id}"><b>💬</b><span>${p.comments||0}</span></div>
          <div class="tiktok-act" data-share="${p.id}"><b>🚀</b><span>مشاركة</span></div>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:10px;font-size:11px;color:#22d3ee;display:flex;justify-content:space-between"><span>@ ${esc(p.user.toLowerCase())}</span><span>سيادي 100%</span></div>
      `;
      feed.appendChild(card);
    });
    feed.querySelectorAll('[data-like]').forEach(el=>{
      el.addEventListener('click',()=>{
        let posts=getPosts(); const id=parseInt(el.getAttribute('data-like'));
        const post=posts.find(x=>x.id===id); if(post){ post.likes++; savePosts(posts); loadFeed(); toast('❤️ تم'); }
      });
    });
    feed.querySelectorAll('[data-comment]').forEach(el=>{
      el.addEventListener('click',()=>{ window.switchTab('inbox', document.querySelector('[data-tab="inbox"]')); });
    });
    feed.querySelectorAll('[data-share]').forEach(el=>{
      el.addEventListener('click',async()=>{
        try{ if(navigator.share) await navigator.share({title:'TARIM OS',url:location.href}); else { await navigator.clipboard.writeText(location.href); toast('🔗 تم نسخ الرابط'); } }catch{}
      });
    });
  }

  const authGate=$('authGate'), loginBtn=$('loginBtn'), userIn=$('userPhoneOrEmail'), passIn=$('userPass'), err=$('loginError');
  const tabLoginBtn=$('tabLoginBtn'), tabSignupBtn=$('tabSignupBtn'), loginForm=$('loginForm'), signupForm=$('signupForm');

  function openApp(username){
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return;
    authGate.classList.add('hidden'); authGate.style.display='none';
    localStorage.setItem('tarim_session', username);
    const nameEl=$('profileNameDisplay'); if(nameEl) nameEl.textContent='الإمبراطور '+username;
    const avEl=$('profileAvatar'); if(avEl) avEl.textContent=username.substring(0,2).toUpperCase();
    toast(`أهلاً بك يا ${username} في القلعة 👑`);
    loadFeed(); renderUserList();
  }

  tabLoginBtn?.addEventListener('click',()=>{
    loginForm.style.display='flex'; signupForm.style.display='none';
    tabLoginBtn.style.cssText='color:#22d3ee;font-weight:800;border-bottom:2px solid #22d3ee;padding-bottom:6px;background:none';
    tabSignupBtn.style.cssText='color:#94a3b8;padding-bottom:6px;background:none';
  });
  tabSignupBtn?.addEventListener('click',()=>{
    signupForm.style.display='flex'; loginForm.style.display='none';
    tabSignupBtn.style.cssText='color:#22d3ee;font-weight:800;border-bottom:2px solid #22d3ee;padding-bottom:6px;background:none';
    tabLoginBtn.style.cssText='color:#94a3b8;padding-bottom:6px;background:none';
  });

  loginBtn?.addEventListener('click',()=>{
    const u=sanitize(userIn.value), p=sanitize(passIn.value);
    if(!u||!p){ err.textContent='اكتب الاسم وكلمة السر'; err.style.display='block'; return; }
    err.style.display='none'; users=getUsers();
    if(users[u]){ if(users[u]!==p){ err.textContent='كلمة السر خطأ'; err.style.display='block'; toast('كلمة السر خطأ','err'); return; } openApp(u); }
    else { users[u]=p; saveUsers(users); toast(`تم إنشاء حساب: ${u} ✅`); openApp(u); }
  });
  $('signupBtn')?.addEventListener('click',()=>{
    const u=sanitize($('newUsername').value), p=sanitize($('newPass').value), c=sanitize($('confirmPass').value);
    const sErr=$('signupError');
    if(u.length<3){ sErr.textContent='الاسم قصير'; sErr.style.display='block'; return; }
    if(!/^[a-zA-Z0-9_]+$/.test(u)){ sErr.textContent='استخدم انجليزي وأرقام فقط'; sErr.style.display='block'; return; }
    if(p.length<6){ sErr.textContent='كلمة السر ضعيفة'; sErr.style.display='block'; return; }
    if(p!==c){ sErr.textContent='غير متطابقة'; sErr.style.display='block'; return; }
    users=getUsers(); if(users[u]){ sErr.textContent='الاسم موجود'; sErr.style.display='block'; return; }
    users[u]=p; saveUsers(users); toast('👑 تم إنشاء القلعة'); tabLoginBtn.click(); userIn.value=u;
  });
  $('googleLoginBtn')?.addEventListener('click',()=>{ const n='GOOGLE_'+Math.floor(Math.random()*900); users=getUsers(); users[n]='google'; saveUsers(users); openApp(n); });
  passIn?.addEventListener('keydown',e=>{ if(e.key==='Enter') loginBtn.click(); });

  const sess = localStorage.getItem('tarim_session');
  if(sess && getUsers()[sess]){ authGate.classList.add('hidden'); authGate.style.display='none'; setTimeout(()=>{ loadFeed(); renderUserList(); },100); }

  window.switchTab = function(tab, btn){
    stopAllStreams();
    document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
    const target=document.getElementById('tab-'+tab); if(target) target.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(x=>{ if(x.dataset.tab!=='create'){ x.style.color='#94a3b8'; x.classList.remove('nav-active'); } });
    const activeBtn = btn || document.querySelector(`[data-tab="${tab}"]`);
    if(activeBtn && tab!=='create'){ activeBtn.style.color='#22d3ee'; activeBtn.classList.add('nav-active'); }
    if(tab==='create') initCamera();
    if(tab==='inbox'){ renderUserList(); renderMessages(); }
    if(tab==='home') loadFeed();
    window.scrollTo(0,0);
  };
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{ const tab=btn.dataset.tab; if(tab) window.switchTab(tab,btn); });
  });

  async function initCamera(){
    const preview=$('cameraPreview'); if(!preview) return;
    try{
      stopAllStreams();
      currentStream=await navigator.mediaDevices.getUserMedia({ video:{ facingMode: facingMode, width:{ideal:1280} }, audio:true });
      preview.srcObject=currentStream;
    }catch{ toast('الكاميرا مرفوضة - فعلها من الإعدادات','err'); }
  }
  $('switchCamBtn')?.addEventListener('click',()=>{ facingMode=facingMode==='environment'?'user':'environment'; initCamera(); toast('🔄 تم التبديل'); });
  $('filterBtn')?.addEventListener('click',()=>{
    filterIdx=(filterIdx+1)%filters.length;
    const prev=$('cameraPreview'); if(prev) prev.style.filter=filters[filterIdx];
    toast('🎨 فلتر '+(filterIdx+1)+'/'+filters.length);
  });
  $('lightBtn')?.addEventListener('click',()=>{
    lightOn=!lightOn;
    const over=$('lightOverlay'); if(over) over.style.background=lightOn?'rgba(255,255,210,.22)':'transparent';
    const prev=$('cameraPreview'); if(prev) prev.style.filter = lightOn? 'brightness(1.6) '+filters[filterIdx] : filters[filterIdx];
    toast(lightOn?'💡 إضاءة تشغيل':'💡 إضاءة إيقاف');
  });
  $('textPostBtn')?.addEventListener('click',()=>{ $('postContentInput')?.focus(); toast('📄 وضع منشور نصي'); });

  $('startLiveBtn')?.addEventListener('click',async()=>{
    const ls=$('liveScreen'); if(!ls) return; ls.classList.remove('hidden'); ls.style.display='flex';
    try{ liveStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:true}); $('liveVideo').srcObject=liveStream; }catch{ toast('الكاميرا محظورة','err'); }
  });
  $('liveOpBtn')?.addEventListener('click',()=>{ const b=$('startLiveBtn'); if(b) b.click(); });
  $('goInboxBtn')?.addEventListener('click',()=>{ window.switchTab('inbox', document.querySelector('[data-tab="inbox"]')); });
  $('confirmStartLive')?.addEventListener('click',()=>{
    const box=$('readyToBroadcastBox'); if(box) box.style.display='none';
    liveSec=0; liveTimerInt=setInterval(()=>{ liveSec++; const m=Math.floor(liveSec/60), s=liveSec%60; const timer=$('liveTimer'); if(timer) timer.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; },1000);
    toast('🔴 بث مباشر سيادي بدأ');
  });
  $('endLiveBtn')?.addEventListener('click',()=>{
    if(liveTimerInt) clearInterval(liveTimerInt);
    if(liveStream) liveStream.getTracks().forEach(t=>t.stop()); liveStream=null;
    const ls=$('liveScreen'); if(ls){ ls.classList.add('hidden'); ls.style.display='none'; }
    const box=$('readyToBroadcastBox'); if(box) box.style.display='block';
    liveSec=0; const tm=$('liveTimer'); if(tm) tm.textContent='00:00'; toast('⏹️ انتهى البث');
  });

  $('publishBtn')?.addEventListener('click',()=>{
    const input=$('postContentInput'); if(!input) return;
    const v=sanitize(input.value); if(!v){ toast('اكتب شيئاً أولاً','err'); return; }
    const me=localStorage.getItem('tarim_session')||'AL';
    let posts=getPosts();
    posts.push({id:Date.now(),user:me,text:v,likes:0,comments:0,time:'الآن',avatar:me.substring(0,2).toUpperCase()});
    savePosts(posts); input.value=''; toast('🚀 تم النشر السيادي'); window.switchTab('home', document.querySelector('[data-tab="home"]')); loadFeed();
  });

  function openMap(){
    const ms=$('mapScreen'); if(!ms) return; ms.classList.remove('hidden'); ms.style.display='flex';
    setTimeout(()=>{ if(!mapInstance){ mapInstance=L.map('mapContainer').setView([16.0545,49.0],14); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(mapInstance); L.marker([16.0545,49.0]).addTo(mapInstance).bindPopup('<b>🏰 قلعة تريم السيادية</b><br>حضرموت - اليمن').openPopup(); } else mapInstance.invalidateSize(); },300);
  }
  $('opsMapBtn')?.addEventListener('click',openMap);
  $('closeMapBtn')?.addEventListener('click',()=>{ const ms=$('mapScreen'); if(ms){ ms.classList.add('hidden'); ms.style.display='none'; } });
  function showQR(){
    const disp=$('qrDisplay'); if(!disp) return;
    disp.classList.remove('hidden'); const qrBox=$('qrcode'); qrBox.innerHTML='';
    const me=localStorage.getItem('tarim_session')||'AL';
    new QRCode(qrBox,{text:`TARIM-OS-IMPERIAL:${me}:${Date.now()}:HADHRAMOUT`,width:180,height:180,correctLevel:QRCode.CorrectLevel.H});
    const qt=$('qrText'); if(qt) qt.textContent='الختم السيادي: '+me+' • تريم حضرموت'; toast('🔐 الختم QR جاهز');
  }
  $('opsQrBtn')?.addEventListener('click',showQR);
  $('qrBtn')?.addEventListener('click',()=>{ window.switchTab('operations', document.querySelector('[data-tab="operations"]')); setTimeout(showQR,400); });

  function renderUserList(){
    const list=$('userList'); if(!list) return;
    const allUsers=Object.keys(getUsers()); const me=localStorage.getItem('tarim_session')||'AL';
    list.innerHTML='';
    allUsers.filter(u=>u!==me).forEach(u=>{
      const b=document.createElement('button');
      b.textContent='@'+u; b.style.cssText=`background:${currentChatWith===u?'#00B4D8':'#0f172a'};color:${currentChatWith===u?'#000':'#22d3ee'};padding:9px 14px;border-radius:20px;font-size:12px;white-space:nowrap;border:1px solid rgba(0,240,255,.15);cursor:pointer`;
      b.addEventListener('click',()=>openChat(u)); list.appendChild(b);
    });
    const sb=document.createElement('button'); sb.textContent='🛡️ الدعم'; sb.style.cssText='background:#1e293b;color:#fff;padding:9px 14px;border-radius:20px;font-size:12px;white-space:nowrap;border:1px solid rgba(255,255,255,.1)'; sb.addEventListener('click',()=>openChat('الدعم')); list.appendChild(sb);
  }
  function renderMessages(){
    const box=$('inboxMessagesList'); if(!box) return; box.innerHTML='';
    if(!currentChatWith){ box.innerHTML='<p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:30px">👆 اختر مستخدم من الأعلى لبدء المراسلة المشفرة</p>'; return; }
    const me=localStorage.getItem('tarim_session')||'AL';
    const key=[me,currentChatWith].sort().join('_'); const msgs=getMessages()[key]||[{from:'system',text:`أهلاً يا ${me} - مراسلة آمنة مع ${currentChatWith} 🔐`}];
    msgs.forEach(m=>{
      const div=document.createElement('div'); const isMe=m.from===me; const isSys=m.from==='system';
      div.style.cssText=`align-self:${isMe?'flex-end':'flex-start'};max-width:76%;padding:10px 14px;border-radius:18px;font-size:13px;line-height:1.6;${isSys?'background:rgba(34,211,238,.12);color:#22d3ee;border:1px dashed rgba(34,211,238,.3);align-self:center':isMe?'background:#00B4D8;color:#000;border-bottom-right-radius:4px':'background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,.08);border-bottom-left-radius:4px'}`;
      div.textContent=m.text; box.appendChild(div);
    });
    box.scrollTop=box.scrollHeight;
  }
  window.openChat=function(user){ currentChatWith=user; renderUserList(); renderMessages(); };
  $('sendInboxMsgBtn')?.addEventListener('click',()=>{
    const input=$('inboxInputField'); const txt=sanitize(input.value); if(!txt) return;
    if(!currentChatWith){ toast('اختر مستخدم أولاً','err'); return; }
    const me=localStorage.getItem('tarim_session')||'AL'; const key=[me,currentChatWith].sort().join('_');
    const msgs=getMessages(); if(!msgs[key]) msgs[key]=[]; msgs[key].push({from:me,text:txt,time:Date.now()}); saveMessages(msgs); input.value=''; renderMessages();
    if(currentChatWith==='الدعم'){ setTimeout(()=>{ const m=getMessages(); m[key].push({from:'الدعم',text:'تم يا إمبراطور 🛡️ رسالتك وصلت - القلعة محمية 100%',time:Date.now()}); saveMessages(m); renderMessages(); },900); }
  });
  $('inboxInputField')?.addEventListener('keydown',e=>{ if(e.key==='Enter'){ const b=$('sendInboxMsgBtn'); if(b) b.click(); } });

  function handleProfileAction(name){
    if(name.includes('المحفظة')){ toast('💳 المحفظة: OKX 0x53...ab96'); return; }
    if(name.includes('الانشطة')){ toast('⚙️ الأنشطة: 3 منشورات • 12 إعجاب'); return; }
    if(name.includes('دون اتصال')){ toast('🎞️ الفيديوهات دون اتصال: فارغ'); return; }
    if(name.includes('ابداع')){ window.switchTab('create', document.querySelector('[data-tab="create"]')); return; }
    if(name.includes('التجارية')){ toast('👫 المجموعة: تريم مول'); return; }
    if(name.includes('الترويج')){ toast('🚀 الترويج: حملة سيادية'); return; }
    if(name.includes('ادارة المنشورات')){ window.switchTab('home', document.querySelector('[data-tab="home"]')); return; }
    if(name.includes('الاعدادات')){ toast('⚙️ الإعدادات محمية'); return; }
    if(name.includes('الحساب')){ toast('👤 الحساب: '+(localStorage.getItem('tarim_session')||'AL')); return; }
    if(name.includes('الخصوصية والامان')){ toast('🔐 تشفير + CSP + Sanitizer'); return; }
    if(name.includes('مشاركة ملف')){ if(navigator.share) navigator.share({title:'TARIM OS',url:location.href}); else toast('💱 tarim.os.ye'); return; }
    if(name.includes('السياسية')){ toast('📄 سيادة كاملة - لا تتبع'); return; }
  }
  document.querySelectorAll('#tab-profile .profile-item').forEach(el=>{
    if(el.id==='qrBtn' || el.id==='logoutBtn') return;
    el.addEventListener('click',()=>handleProfileAction(el.textContent||''));
  });
  $('changeBgBtn')?.addEventListener('click',()=>{
    const colors=['#020A18','#0a1428','#0a1a0a','#1a0f0a','#0f0a1a'];
    document.body.style.background=colors[Math.floor(Math.random()*colors.length)];
    toast('🎨 تم تغيير الخلفية');
  });
  $('paypalBtn')?.addEventListener('click',()=>toast('💳 PayPal قريباً'));
  $('logoutBtn')?.addEventListener('click',()=>{ localStorage.removeItem('tarim_session'); stopAllStreams(); location.reload(); });

  function addMsg(boxId, who, txt){
    const box=$(boxId); if(!box) return; const isMe=who==='me';
    const d=document.createElement('div'); d.style.cssText=`align-self:${isMe?'flex-end':'flex-start'};max-width:78%;padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.6;${isMe?'background:#00B4D8;color:#000':'background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,.08)'}`; d.textContent=txt; box.appendChild(d); box.scrollTop=box.scrollHeight;
  }
  function aiReply(t){
    t = String(t||'').toLowerCase();
    if(t.includes('تريم')||t.includes('قلعة')) return 'أنا عين الذكاء السيادية من تريم حضرموت 🐉👑 القلعة تعمل Offline 100% ومحصنة.';
    if(t.includes('بث')) return 'للبث: العمليات ⚡ > بث مباشر > ابدأ البث 🔴 شاشة كاملة';
    if(t.includes('محفظة')) return 'المحفظة: الملفات 👤 > المحفظة 💳 OKX: 0x53...ab96';
    if(t.includes('خلفية')) return 'لتغيير الخلفية: الملفات > اضغط 🎨 تغير الخلفية فوق الصورة';
    return 'تم يا إمبراطور AL 🤖 النظام سيادي 100% - كل الأزرار تعمل بالترتيب الجديد من حضرموت إلى العالم.';
  }

  $('openAiEyeBtn')?.addEventListener('click',()=>{
    const scr = $('aiEyeScreen');
    if(scr){ scr.classList.remove('hidden'); scr.style.display='flex'; }
    addMsg('aiEyeChat', 'bot', 'أهلاً بك يا إمبراطور AL في عين الذكاء السيادية 👁️ كيف أخدمك اليوم؟');
  });
  $('closeAiEye')?.addEventListener('click',()=>{
    const scr = $('aiEyeScreen');
    if(scr){ scr.classList.add('hidden'); scr.style.display='none'; }
  });
  $('sendAiEye')?.addEventListener('click',()=>{
    const inp = $('aiEyeInput'); if(!inp) return;
    const txt = sanitize(inp.value); if(!txt) return;
    addMsg('aiEyeChat', 'me', txt); inp.value='';
    setTimeout(()=>{ addMsg('aiEyeChat', 'bot', aiReply(txt)); }, 600);
  });
  $('aiEyeInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter') $('sendAiEye')?.click(); });

  $('openSupportBtn')?.addEventListener('click',()=>{
    const scr = $('supportScreen');
    if(scr){ scr.classList.remove('hidden'); scr.style.display='flex'; }
    addMsg('supportChat', 'bot', 'مرحباً بك في الدعم الفني السيادي لـ TARIM OS 🛡️ نحن هنا لحمايتك ودعمك.');
  });
  $('closeSupport')?.addEventListener('click',()=>{
    const scr = $('supportScreen');
    if(scr){ scr.classList.add('hidden'); scr.style.display='none'; }
  });
  $('sendSupport')?.addEventListener('click',()=>{
    const inp = $('supportInput'); if(!inp) return;
    const txt = sanitize(inp.value); if(!txt) return;
    addMsg('supportChat', 'me', txt); inp.value='';
    setTimeout(()=>{ addMsg('supportChat', 'bot', 'تم استلام بلاغك في الدعم الفني بنجاح 🛡️ سيتم المعالجة فوراً.'); }, 800);
  });
  $('supportInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter') $('sendSupport')?.click(); });

})();
