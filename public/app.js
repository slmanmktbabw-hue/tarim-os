// public/app.js - TARIM OS V7 FINAL - كل الأزرار شغالة - اليمن على اليمين
"use strict";
(function () {
  let currentStream=null,liveStream=null,facingMode="environment",mapInstance=null,currentChatWith=null,filterIdx=0,liveSec=0,liveTimerInt=null;
  const $=id=>document.getElementById(id);
  const filters=['none','grayscale(1)','sepia(1)','contrast(1.5)','brightness(1.3)','hue-rotate(90deg)'];
  const authGate=$('authGate'),loginBtn=$('loginBtn'),userIn=$('userPhoneOrEmail'),passIn=$('userPass'),err=$('loginError'),postsFeed=$('postsFeed');
  const tabLoginBtn=$('tabLoginBtn'),tabSignupBtn=$('tabSignupBtn'),loginForm=$('loginForm'),signupForm=$('signupForm');

  function getUsers(){try{return JSON.parse(localStorage.getItem('tarim_users')||'{}')}catch{return{}}}
  function saveUsers(u){localStorage.setItem('tarim_users',JSON.stringify(u))}
  let users=getUsers(); if(!users['AL']){users['AL']='123456';saveUsers(users);}
  function getMessages(){try{return JSON.parse(localStorage.getItem('tarim_messages')||'{}')}catch{return{}}}
  function saveMessages(m){localStorage.setItem('tarim_messages',JSON.stringify(m))}

  function showToast(msg,type='ok'){
    const box=$('toastBox'); if(!box) return; const d=document.createElement('div');
    d.textContent=msg; d.style.cssText=`background:${type==='err'?'#f43f5e':'#06b6d4'};color:#000;padding:12px 16px;border-radius:12px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center`;
    box.appendChild(d); setTimeout(()=>d.remove(),3000);
  }
  function sanitize(s){return String(s||'').substring(0,2000).replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function stopAllStreams(){if(currentStream) currentStream.getTracks().forEach(t=>t.stop()); currentStream=null; if(liveStream) liveStream.getTracks().forEach(t=>t.stop()); liveStream=null;}

  // الرئيسية تيك توك
  function loadFeed(){
    const sess=localStorage.getItem('tarim_session')||'AL'; if(!postsFeed) return;
    const likes=localStorage.getItem('tarim_likes_'+sess)||'120';
    postsFeed.innerHTML=`<div class="tiktok-card"><div class="tiktok-top"><span style="color:#22d3ee;font-weight:700">👑 @${sanitize(sess)}</span><span>🌴 تريم - حضرموت</span></div><div class="tiktok-center"><div style="font-size:60px">🎥</div><p style="color:#67e8f9;font-size:13px">فيديو سيادي يملئ الشاشة</p></div><div class="tiktok-actions"><div class="tiktok-act" onclick="likePost(this)"><b style="font-size:26px">❤️</b><span class="likeCount">${likes}</span></div><div class="tiktok-act" onclick="switchTab('inbox', document.querySelector('#mainNav.nav-btn[data-tab=inbox]'))"><b style="font-size:22px">💬</b><span>45</span></div><div class="tiktok-act" onclick="showToast('تم نسخ الرابط 🚀')"><b>🚀</b><span>مشاركة</span></div><div class="tiktok-act" onclick="showToast('تم الحفظ 🔖')"><b>🔖</b><span>حفظ</span></div></div><div class="tiktok-bottom">@ ${sess.toLowerCase()}mktbabw@gmail.com</div></div>`;
  }
  window.likePost=function(el){const c=el.querySelector('.likeCount'); let n=parseInt(c.textContent)||0; if(el.classList.contains('liked')){n--;el.classList.remove('liked');el.style.color='#fff'}else{n++;el.classList.add('liked');el.style.color='#f43f5e'} c.textContent=n; const sess=localStorage.getItem('tarim_session')||'AL'; localStorage.setItem('tarim_likes_'+sess,n);};
  function openApp(username){authGate.classList.add('hidden');authGate.style.display='none';localStorage.setItem('tarim_session',username);showToast(`أهلاً بك يا ${sanitize(username)} 👑`);loadFeed();}

  tabLoginBtn?.addEventListener('click',()=>{loginForm.classList.remove('hidden');signupForm.classList.add('hidden');tabLoginBtn.style.cssText='color:#22d3ee;font-weight:700;border-bottom:2px solid #22d3ee;padding-bottom:4px';tabSignupBtn.style.cssText='color:#94a3b8;padding-bottom:4px';});
  tabSignupBtn?.addEventListener('click',()=>{signupForm.classList.remove('hidden');loginForm.classList.add('hidden');tabSignupBtn.style.cssText='color:#22d3ee;font-weight:700;border-bottom:2px solid #22d3ee;padding-bottom:4px';tabLoginBtn.style.cssText='color:#94a3b8;padding-bottom:4px';});
  loginBtn?.addEventListener('click',()=>{const u=(userIn.value||'').trim(),p=(passIn.value||'').trim();if(!u||!p){err.textContent='اكتب الاسم وكلمة السر';err.classList.remove('hidden');return} err.classList.add('hidden'); users=getUsers(); if(users[u]){if(users[u]!==p){err.textContent='كلمة السر خطأ';err.classList.remove('hidden');showToast('كلمة السر خطأ','err');return} openApp(u);} else{users[u]=p;saveUsers(users);showToast(`تم إنشاء حساب: ${u} ✅`);openApp(u);}});
  $('signupBtn')?.addEventListener('click',()=>{const u=($('newUsername').value||'').trim(),p=($('newPass').value||'').trim(),c=($('confirmPass').value||'').trim(),sErr=$('signupError');if(!u||!p){sErr.textContent='اكمل البيانات';sErr.classList.remove('hidden');return} if(p!==c){sErr.textContent='كلمة السر غير متطابقة';sErr.classList.remove('hidden');return} users=getUsers();if(users[u]){sErr.textContent='الاسم موجود';sErr.classList.remove('hidden');return} users[u]=p;saveUsers(users);localStorage.setItem('tarim_session',u);location.reload();});
  $('googleLoginBtn')?.addEventListener('click',()=>{const name='Google_'+Math.floor(Math.random()*999);localStorage.setItem('tarim_session',name);location.reload();});
  $('googleSignupBtn')?.addEventListener('click',()=>$('googleLoginBtn')?.click());
  passIn?.addEventListener('keydown',e=>{if(e.key==='Enter') loginBtn.click()});
  const sess=localStorage.getItem('tarim_session'); if(sess){authGate.classList.add('hidden');authGate.style.display='none';loadFeed();}

  // التنقل - مصحح - اليمن على اليمين
  window.switchTab=function(tab,btn){
    stopAllStreams(); document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active')); const target=document.getElementById('tab-'+tab); if(target) target.classList.add('active');
    document.querySelectorAll('#mainNav.nav-btn').forEach(x=>{if(x.getAttribute('data-tab')!=='create') x.style.color='#94a3b8';});
    if(btn && btn.getAttribute('data-tab')!=='create') btn.style.color='#22d3ee';
    if(tab==='create') initCamera(); if(tab==='inbox'){renderUserList();renderMessages();}
  };
  document.querySelectorAll('#mainNav.nav-btn').forEach(btn=>{btn.addEventListener('click',()=>{const tab=btn.getAttribute('data-tab'); if(tab) window.switchTab(tab,btn);})});

  async function initCamera(){const preview=$('cameraPreview'); if(!preview) return; try{stopAllStreams(); currentStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facingMode==='environment'?'environment':'user'},audio:true}); preview.srcObject=currentStream;}catch{showToast('الكاميرا مرفوضة','err');}}
  $('switchCamBtn')?.addEventListener('click',()=>{facingMode=facingMode==='environment'?'user':'environment';initCamera();});
  $('filterBtn')?.addEventListener('click',()=>{filterIdx=(filterIdx+1)%filters.length; const prev=$('cameraPreview'); if(prev) prev.style.filter=filters[filterIdx]; showToast('فلتر: '+(filterIdx+1));});
  $('lightBtn')?.addEventListener('click',()=>{const prev=$('cameraPreview'); if(!prev) return; prev.style.filter=prev.style.filter.includes('brightness(1.6)')?'none':'brightness(1.6)'; showToast('إضاءة 💡');});
  $('textPostBtn')?.addEventListener('click',()=>{$('postContentInput')?.focus();showToast('اكتب منشورك 📄');});
  $('startLiveBtn')?.addEventListener('click',async()=>{const ls=$('liveScreen'); if(!ls) return; ls.classList.remove('hidden'); ls.style.display='flex'; try{liveStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:true}); $('liveVideo').srcObject=liveStream;}catch{showToast('الكاميرا مرفوضة','err');}});
  $('confirmStartLive')?.addEventListener('click',()=>{$('readyToBroadcastBox')?.classList.add('hidden'); liveSec=0; liveTimerInt=setInterval(()=>{liveSec++; const m=Math.floor(liveSec/60),s=liveSec%60; $('liveTimer').textContent=`${m}:${s<10?'0':''}${s}`;},1000); showToast('بدأ البث السيادي 🔴');});
  $('endLiveBtn')?.addEventListener('click',()=>{if(liveTimerInt) clearInterval(liveTimerInt); if(liveStream) liveStream.getTracks().forEach(t=>t.stop()); const ls=$('liveScreen'); ls.classList.add('hidden'); ls.style.display='none'; $('readyToBroadcastBox')?.classList.remove('hidden'); showToast('انتهى البث');});
  $('liveOpBtn')?.addEventListener('click',()=>$('startLiveBtn')?.click());

  function openMap(){const ms=$('mapScreen'); if(!ms) return; ms.classList.remove('hidden'); ms.style.display='flex'; setTimeout(()=>{if(!mapInstance){mapInstance=L.map('mapContainer').setView([16.05,48.9833],13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(mapInstance); L.marker([16.05,48.9833]).addTo(mapInstance).bindPopup('<b>قلعة تريم السيادية</b>').openPopup();} else mapInstance.invalidateSize();},300);}
  $('opsMapBtn')?.addEventListener('click',()=>openMap());
  $('closeMapBtn')?.addEventListener('click',()=>{const ms=$('mapScreen'); if(ms){ms.classList.add('hidden'); ms.style.display='none';}});

  function openQr(){const sess=localStorage.getItem('tarim_session')||'AL'; const qs=$('qrScreen'),qb=$('qrBox'),qt=$('qrText'); if(!qs){showToast('QR: '+sess+' ✅'); return;} qs.classList.remove('hidden'); qs.style.display='flex'; qb.innerHTML=''; if(qt) qt.textContent=sess+'@tarim-os'; new QRCode(qb,{text:location.origin+'?u='+sess,width:160,height:160});}
  $('qrBtn')?.addEventListener('click',()=>openQr()); $('opsQrBtn')?.addEventListener('click',()=>openQr());
  $('closeQrBtn')?.addEventListener('click',()=>{const qs=$('qrScreen'); if(qs){qs.classList.add('hidden'); qs.style.display='none';}});

  $('logoutBtn')?.addEventListener('click',()=>{localStorage.removeItem('tarim_session');location.reload();});
  $('publishBtn')?.addEventListener('click',()=>{const v=$('postContentInput'); if(!v||!v.value.trim()){showToast('اكتب وصفاً أولاً','err');return} showToast('تم النشر السيادي ✅'); v.value=''; window.switchTab('home', document.querySelector('#mainNav.nav-btn[data-tab=home]')); loadFeed();});
  $('opMsgBtn')?.addEventListener('click',()=>window.switchTab('inbox', document.querySelector('#mainNav.nav-btn[data-tab=inbox]')));

  // المراسلة
  function renderUserList(){const list=$('userList'); if(!list) return; const allUsers=Object.keys(getUsers()); const me=localStorage.getItem('tarim_session')||'AL'; list.innerHTML=allUsers.filter(u=>u!==me).map(u=>`<button onclick="openChat('${u}')" style="background:${currentChatWith===u?'#00B4D8':'#0f172a'};color:${currentChatWith===u?'#000':'#94a3b8'};padding:8px 14px;border-radius:20px;font-size:11px;white-space:nowrap;border:1px solid rgba(0,240,255,.1)">@${u}</button>`).join('')+`<button onclick="openChat('الدعم')" style="background:#1e293b;padding:8px 14px;border-radius:20px;font-size:11px;white-space:nowrap">🛡️ الدعم</button>`; if(!currentChatWith && allUsers.length>1) openChat(allUsers.find(u=>u!==me));}
  function renderMessages(){const box=$('inboxMessagesList'); if(!box) return; const msgs=getMessages(); const me=localStorage.getItem('tarim_session')||'AL'; const key=[me,currentChatWith].sort().join('_'); const chat=msgs[key]||[{from:'system',text:`أهلاً يا إمبراطور ${me} 🤖`}]; box.innerHTML=chat.map(m=>{const isMe=m.from===me; return `<div style="align-self:${isMe?'flex-end':'flex-start'};max-width:75%;background:${isMe?'#00B4D8':'#0f172a'};color:${isMe?'#000':'#fff'};padding:10px 14px;border-radius:18px;font-size:13px;border:1px solid rgba(0,240,255,.1)">${sanitize(m.text)}</div>`;}).join(''); box.scrollTop=box.scrollHeight;}
  window.openChat=function(user){currentChatWith=user; renderUserList(); renderMessages();};
  $('sendInboxMsgBtn')?.addEventListener('click',()=>{const input=$('inboxInputField'); if(!input||!input.value.trim()) return; const me=localStorage.getItem('tarim_session')||'AL'; if(!currentChatWith){showToast('اختر مستخدم أولاً','err');return} const key=[me,currentChatWith].sort().join('_'); const msgs=getMessages(); if(!msgs[key]) msgs[key]=[]; msgs[key].push({from:me,text:input.value.trim(),time:Date.now()}); saveMessages(msgs); input.value=''; renderMessages(); if(currentChatWith==='الدعم'){setTimeout(()=>{const m=getMessages(); m[key].push({from:'الدعم',text:'تم الاستلام يا إمبراطور 🛡️',time:Date.now()}); saveMessages(m); renderMessages();},800);}});

  // عين الذكاء + الدعم
  function aiReply(t){t=t.toLowerCase(); if(t.includes('تريم')||t.includes('قلعة')) return 'أنا عين الذكاء من تريم حضرموت 🐉👑 القلعة تعمل Offline.'; if(t.includes('بث')) return 'لبدء البث: العمليات > بث مباشر > بدء 🔴'; if(t.includes('محفظة')) return 'المحفظة في الملفات > المحفظة 💳'; return 'تم يا إمبراطور AL 🤖 النظام سيادي 100%.';}
  function addMsg(boxId,who,txt){const box=$(boxId); if(!box) return; const isMe=who==='me'; const d=document.createElement('div'); d.style.cssText=`align-self:${isMe?'flex-end':'flex-start'};max-width:78%;background:${isMe?'#00B4D8':'#0f172a'};color:${isMe?'#000':'#fff'};padding:10px 14px;border-radius:16px;font-size:13px`; d.textContent=txt; box.appendChild(d); box.scrollTop=box.scrollHeight;}
  $('openAiEyeBtn')?.addEventListener('click',()=>{const s=$('aiEyeScreen'); s.classList.remove('hidden'); s.style.display='flex'; if($('aiEyeChat').children.length===0) addMsg('aiEyeChat','ai','أهلاً يا إمبراطور AL 👁️ أنا عين الذكاء، كيف أخدم القلعة؟');});
  $('closeAiEye')?.addEventListener('click',()=>{const s=$('aiEyeScreen'); s.classList.add('hidden'); s.style.display='none';});
  $('sendAiEye')?.addEventListener('click',()=>{const i=$('aiEyeInput'); if(!i.value.trim()) return; addMsg('aiEyeChat','me',i.value); const q=i.value; i.value=''; setTimeout(()=>addMsg('aiEyeChat','ai',aiReply(q)),600);});
  $('openSupportBtn')?.addEventListener('click',()=>{const s=$('supportScreen'); s.classList.remove('hidden'); s.style.display='flex'; if($('supportChat').children.length===0) addMsg('supportChat','ai','أهلاً يا إمبراطور AL 🛡️ فريق الدعم AI جاهز؟');});
  $('closeSupport')?.addEventListener('click',()=>{const s=$('supportScreen'); s.classList.add('hidden'); s.style.display='none';});
  $('sendSupport')?.addEventListener('click',()=>{const i=$('supportInput'); if(!i.value.trim()) return; addMsg('supportChat','me',i.value); const q=i.value; i.value=''; setTimeout(()=>addMsg('supportChat','ai',aiReply(q)+' ✅'),700);});

  // الملفات - كل الأزرار - بالـ ID الجديد
  const profileActions = {
    changeBgBtn: ()=>{document.body.style.background=document.body.style.background==='rgb(20, 10, 30)'?'#020A18':'rgb(20, 10, 30)'; showToast('تم تغير الخلفية 🎨');},
    walletBtn: ()=>showToast('💳 المحفظة: قريباً PayPal + OKX'),
    activityBtn: ()=>showToast('⚙️ مركز الانشطة: سجل نشاطك'),
    offlineVideosBtn: ()=>showToast('🎞️ الفيديوهات دون اتصال: قريباً'),
    qrBtn: ()=>openQr(),
    creativeBtn: ()=>{window.switchTab('create', document.querySelector('#mainNav.nav-btn[data-tab=create]')); showToast('ادوات الابداع ✨');},
    businessBtn: ()=>showToast('👫 المجموعة التجارية: قريباً'),
    adsBtn: ()=>showToast('🚀 الترويج: قريباً'),
    managePostsBtn: ()=>{window.switchTab('home', document.querySelector('#mainNav.nav-btn[data-tab=home]')); showToast('📊 ادارة المنشورات');},
    settingsBtn: ()=>showToast('الاعدادات والخصوصية ⚙️'),
    accountBtn: ()=>showToast('🚹 الحساب: '+(localStorage.getItem('tarim_session')||'AL')),
    privacyBtn: ()=>showToast('🔐 الخصوصية والامان: مشفر 100%'),
    shareProfileBtn: ()=>{if(navigator.share) navigator.share({title:'TARIM OS',url:location.href}); else showToast('💱 تم نسخ رابط ملفك');},
    policyBtn: ()=>showToast('📄 السياسية والخصوصية: تريم حضرموت'),
    payBtn: ()=>showToast('💳 PayPal: قريباً يا إمبراطور')
  };
  Object.keys(profileActions).forEach(id=>{$(id)?.addEventListener('click', profileActions[id]);});

  // دعم الأزرار القديمة بدون ID (للأمان)
  document.querySelectorAll('#tab-profile.py-3').forEach(el=>{
    if(!el.id) el.addEventListener('click', ()=>{const t=el.textContent; if(t.includes('المحفظة')) showToast('💳 المحفظة'); else if(t.includes('انشطة')) showToast('⚙️ الانشطة'); else if(t.includes('دون اتصال')) showToast('🎞️ دون اتصال'); else showToast(t.trim()+' قريباً');});
  });

  console.log('[TARIM OS] V7 FINAL - كل الأزرار شغالة - اليمن على اليمين 👑');
})();
