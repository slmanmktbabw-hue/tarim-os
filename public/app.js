// public/app.js - V8.10 FINAL GOLD - V8.3 SECURE + TIKTOK FEED + OPERATIONS FULL + FULLSCREEN PRO
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  function toast(m) {const b=$('toastBox');if(!b)return;const e=document.createElement('div');e.textContent=String(m).slice(0,200);e.style.cssText='background:#00B4D8;color:#000;padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center';b.appendChild(e);setTimeout(()=>e.remove(),3000);}
  function sanitizeText(t, maxLen=1000){if(!t)return"";return String(t).slice(0,maxLen).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
  // TIKTOK FEED - منشورات الجمهور الجاهزة
  const DEMO_POSTS=[
    {id:101,username:'مطبخ_تريم',avatar:'🍲',content:'كبسة حضرمية على أصولها - مطبخ الوالدة في تريم 🌴 #تريم',likes:342,comments:28,shares:12,isLive:false,color:'#FF6B35',viewers:0},
    {id:102,username:'AL_الامبراطور',avatar:'👑',content:'بث مباشر سيادي - TARIM OS V8.10 TIKTOK FEED 🔥',likes:1205,comments:89,shares:45,isLive:true,viewers:156,color:'#FF0000'},
    {id:103,username:'صقور_حضرموت',avatar:'🦅',content:'أهداف اليوم تريم vs سيئون 3-1 ⚽🔥',likes:892,comments:56,shares:23,isLive:false,color:'#1E90FF',viewers:0},
    {id:104,username:'تراثنا',avatar:'🏺',content:'بيت الطين 300 سنة - تريم القديمة 🏰',likes:567,comments:34,shares:18,isLive:false,color:'#8B4513',viewers:0},
    {id:105,username:'تاجر_العسل',avatar:'🍯',content:'عسل سدر حضرمي ملكي قطفة اليوم 💬',likes:234,comments:19,shares:8,isLive:false,color:'#DAA520',viewers:0},
    {id:106,username:'بنت_تريم',avatar:'🌸',content:'جولة في سوق تريم القديم 🌴✨',likes:445,comments:22,shares:9,isLive:false,color:'#FF69B4',viewers:0},
  ];
  let state={curStream:null,facing:'user',map:null,liveInt:null,lSec:0,liveMode:false,likes:0,capImg:null,upURL:null,upIsVideo:false,watchTimer:null,currentWatchTime:0,abortCtrl:null};
  function startUesWatchSimulation(){if(state.watchTimer)clearInterval(state.watchTimer);if(state.abortCtrl)state.abortCtrl.abort();state.currentWatchTime=0;state.abortCtrl=new AbortController();state.watchTimer=setInterval(async()=>{state.currentWatchTime+=5;if(state.currentWatchTime>=20){clearInterval(state.watchTimer);try{const res=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},signal:state.abortCtrl.signal,body:JSON.stringify({user_profile:{country:'YE',interest:'cooking',repeat_count:0},current_video:{duration:45,watch_time:state.currentWatchTime}})});if(!res.ok)throw new Error('offline');const data=await res.json();if(data.action==='split_screen'&&data.video_id){const vid=String(data.video_id).replace(/[^a-zA-Z0-9_\-]/g,'').slice(0,50);if(['short_funny_01','short_tip_02','ye_cooking_restaurant_001','ye_football_highlights_002'].includes(vid)||vid.startsWith('trending_')){toast('⚡ Tarim_Fortress: '+vid);}}}catch(err){if(err.name!=='AbortError')console.log('Tarim_Fortress: Offline Mode');}}},5000);}
  function stopStream(){if(state.curStream){state.curStream.getTracks().forEach(t=>t.stop());state.curStream=null;}if(state.liveInt){clearInterval(state.liveInt);state.liveInt=null;}if(state.watchTimer){clearInterval(state.watchTimer);state.watchTimer=null;}if(state.abortCtrl){state.abortCtrl.abort();state.abortCtrl=null;}if(state.upURL){URL.revokeObjectURL(state.upURL);state.upURL=null;}}
  function switchTab(name,btn){
    if(state.liveMode){toast('🔴 أنهي البث أولاً');return;}
    stopStream();
    document.querySelectorAll('.tab-content').forEach(t=>{t.classList.remove('active');t.classList.add('hidden');});
    const tar=$('tab-'+name);if(tar){tar.classList.remove('hidden');tar.classList.add('active');}
    document.querySelectorAll('.nav-btn').forEach(b=>{b.classList.remove('text-cyan-400');b.classList.add('text-slate-400');});
    if(btn)btn.classList.add('text-cyan-400');
    if(name==='create')initCam();
    if(name==='profile'){backToProfile();updateCounters();}
    if(name==='home'){renderAllFeeds();startUesWatchSimulation();}
    if(name==='operations'){updateOpsCounters();}
  }
  function showSubPage(id){const main=$('profile-main');if(main)main.classList.add('hidden');document.querySelectorAll('.sub-page').forEach(p=>p.classList.add('hidden'));const t=$('sub-'+id);if(t){t.classList.remove('hidden');if(id==='qr-page'){const c=$('qrcode');if(c){c.textContent='';if(window.QRCode){new QRCode(c,{text:'https://tarimos.org/user/'+sanitizeText(localStorage.getItem('tarim_session_v73')||'AL',30),width:128,height:128});}}}}}
  function backToProfile(){document.querySelectorAll('.sub-page').forEach(p=>p.classList.add('hidden'));$('profile-main')?.classList.remove('hidden');updateCounters();}
  function updateCounters(){const posts=getPosts();if($('countFollowers'))$('countFollowers').textContent=posts.length+142;if($('countFollowing'))$('countFollowing').textContent=Math.floor(posts.length/2)+48;if($('countLikes'))$('countLikes').textContent=posts.reduce((a,b)=>a+(b.likes||0),0)+1205;if($('activityPosts'))$('activityPosts').textContent=posts.length;}
  function updateOpsCounters(){const posts=getPosts();const el1=$('opViews');if(el1)el1.textContent=(posts.length*123+1205).toString();const el2=$('opFollowers');if(el2)el2.textContent=(posts.length+156).toString();}
  async function initCam(){const v=$('cameraPreview');if(!v)return;try{if(state.curStream)state.curStream.getTracks().forEach(t=>t.stop());state.curStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:state.facing,width:{ideal:1280},height:{ideal:720}},audio:true});v.srcObject=state.curStream;await v.play().catch(()=>{});}catch{toast('الكاميرا تحتاج HTTPS أو صلاحية وصول');}}
  function setFilter(t){const v=$('cameraPreview');if(!v)return;v.style.filter=t==='beauty'?'contrast(1.15) brightness(1.15) saturate(1.2)':'none';toast(t==='beauty'?'💄 تجميل':'✨ طبيعي');}
  function switchCam(){state.facing=state.facing==='user'?'environment':'user';initCam();}
  function capturePhoto(){const v=$('cameraPreview');if(!v)return;const c=document.createElement('canvas');c.width=v.videoWidth||640;c.height=v.videoHeight||480;const ctx=c.getContext('2d');if(ctx){ctx.drawImage(v,0,0);state.capImg=c.toDataURL('image/jpeg',0.85);toast('📸 تم التقاط صورة');}}
  function getPosts(){try{const data=localStorage.getItem('tarim_posts_v73');if(!data)return[];const arr=JSON.parse(data);if(!Array.isArray(arr))return[];return arr.slice(-100).filter(p=>p&&typeof p==='object'&&typeof p.content==='string'&&p.content.length<=1000);}catch{return[];}}
  function savePosts(p){try{localStorage.setItem('tarim_posts_v73',JSON.stringify(p.slice(-100)));}catch{toast('التخزين ممتلئ');}}
  // الرئيسية مثل تيك توك - منشورات الجمهور
  function renderAllFeeds(){
    const f=$('postsFeed');const liveBox=$('activeLivesFeed');if(!f)return;f.textContent='';if(liveBox)liveBox.textContent='';
    const userPosts=getPosts();
    const all=[...userPosts.reverse().map(p=>({...p,isUser:true,likes:p.likes||0,comments:0,shares:0,color:'#00B4D8',avatar:'👑',viewers:0})),...DEMO_POSTS];
    if(liveBox){
      const lives=all.filter(p=>p.isLive);
      if(lives.length){
        const t=document.createElement('div');t.className='text-[10px] text-rose-400 font-bold mb-2';t.textContent='🔴 مباشر الآن • '+lives.length;liveBox.appendChild(t);
        lives.forEach(p=>{
          const el=document.createElement('div');el.className='glass p-3 rounded-xl border border-rose-500/40 flex justify-between items-center mb-2 cursor-pointer';
          const left=document.createElement('div');left.className='flex items-center gap-2';
          const av=document.createElement('div');av.className='w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center';av.textContent=sanitizeText(p.avatar,5);
          const info=document.createElement('div');info.className='text-right';const u=document.createElement('div');u.className='text-xs font-bold';u.textContent='@'+sanitizeText(p.username,20);const vw=document.createElement('div');vw.className='text-[9px] text-rose-300';vw.textContent='👁️ '+Number(p.viewers||0)+' يشاهد';info.appendChild(u);info.appendChild(vw);left.appendChild(av);left.appendChild(info);
          const badge=document.createElement('div');badge.className='text-[10px] bg-rose-500 text-white px-3 py-1 rounded-full';badge.textContent='دخول';
          el.appendChild(left);el.appendChild(badge);el.addEventListener('click',()=>toast('🔴 دخلت بث @'+sanitizeText(p.username,20)));liveBox.appendChild(el);
        });
      }
    }
    if(!all.length){const empty=document.createElement('div');empty.className='glass p-8 rounded-2xl text-center text-slate-400 text-xs';empty.textContent='لا منشورات بعد 👑';f.appendChild(empty);return;}
    all.forEach(p=>{
      const card=document.createElement('div');card.className='glass rounded-2xl overflow-hidden border border-cyan-500/20 mb-3';
      const h=document.createElement('div');h.className='p-3 flex justify-between items-center';
      const u=document.createElement('div');u.className='flex items-center gap-2';
      const av=document.createElement('div');av.className='w-9 h-9 rounded-full flex items-center justify-center font-bold text-white';av.style.background=p.color||'#333';av.textContent=sanitizeText(p.avatar,5);
      const nd=document.createElement('div');nd.className='text-right';nd.innerHTML=`<div class="text-xs font-bold">@${sanitizeText(p.username,20)}</div><div class="text-[9px] text-slate-400">${p.isLive?'🔴 مباشر • تريم':'📍 تريم'}</div>`;
      u.appendChild(av);u.appendChild(nd);
      const follow=document.createElement('button');follow.className='text-[10px] border border-cyan-500/40 text-cyan-400 px-3 py-1 rounded-full';follow.textContent=p.isUser?'أنت':'متابعة';follow.addEventListener('click',()=>{follow.textContent=follow.textContent==='متابعة'?'تم ✅':'متابعة';});
      h.appendChild(u);h.appendChild(follow);
      const video=document.createElement('div');video.className='w-full h-[42vh] relative flex items-center justify-center';video.style.background=p.isLive?'linear-gradient(135deg,#FF0000,#8B0000)':`linear-gradient(135deg,${p.color||'#000'},#030B1A)`;
      const inner=document.createElement('div');inner.className='text-center p-4';inner.innerHTML=`<div class="text-5xl mb-2">${p.isLive?'🔴':sanitizeText(p.avatar,5)}</div>`;const cSpan=document.createElement('div');cSpan.className='text-xs font-bold text-white max-w-[80%] mx-auto';cSpan.textContent=sanitizeText(p.content,120);inner.appendChild(cSpan);video.appendChild(inner);
      if(p.isLive){const tag=document.createElement('div');tag.className='absolute top-2 left-2 bg-rose-500 text-white text-[9px] px-2 py-1 rounded-full animate-pulse';tag.textContent='🔴 LIVE';video.appendChild(tag);}
      const act=document.createElement('div');act.className='p-3';const desc=document.createElement('p');desc.className='text-xs text-slate-200 mb-3 text-right';desc.textContent=sanitizeText(p.content,200);
      const btns=document.createElement('div');btns.className='flex justify-between text-[11px]';const left=document.createElement('div');left.className='flex gap-4';
      const like=document.createElement('button');like.className='text-slate-400';like.innerHTML=`❤️ ${Number(p.likes)}`;like.addEventListener('click',()=>{p.likes++;like.innerHTML=`❤️ ${Number(p.likes)}`;const tl=$('liveLikesTop');if(tl)tl.textContent=p.likes;toast('❤️ إعجاب');});
      const comm=document.createElement('button');comm.className='text-slate-400';comm.innerHTML=`💬 ${Number(p.comments)}`;comm.addEventListener('click',()=>{const c=prompt('تعليق:');if(c)toast('💬 '+sanitizeText(c,20));});
      const share=document.createElement('button');share.className='text-slate-400';share.innerHTML=`↗️ ${Number(p.shares)}`;share.addEventListener('click',()=>{p.shares++;share.innerHTML=`↗️ ${Number(p.shares)}`;});
      left.appendChild(like);left.appendChild(comm);left.appendChild(share);
      const right=document.createElement('div');right.className='flex gap-2';const gift=document.createElement('button');gift.className='bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 rounded-full';gift.textContent='🎁';gift.addEventListener('click',()=>{const g=$('giftAnim');if(g){g.textContent='🎁💎👑';setTimeout(()=>g.textContent='',1500);}toast('🎁 هدية!');});right.appendChild(gift);
      btns.appendChild(left);btns.appendChild(right);act.appendChild(desc);act.appendChild(btns);
      card.appendChild(h);card.appendChild(video);card.appendChild(act);f.appendChild(card);
    });
  }
  function publishPost(){const inp=$('postContentInput');if(!inp||!inp.value.trim()){toast('اكتب شيئاً');return;}const post={id:Date.now(),content:sanitizeText(inp.value,1000),username:sanitizeText(localStorage.getItem('tarim_session_v73')||'AL',30),createdAt:new Date().toISOString(),likes:0};const all=getPosts();all.push(post);savePosts(all);inp.value='';if(state.upURL){URL.revokeObjectURL(state.upURL);state.upURL=null;}state.capImg=null;renderAllFeeds();updateCounters();toast('🚀 تم النشر');}
  function forceUnlockCastle(){const u=sanitizeText($('userPhoneOrEmail')?.value.trim()||'AL',30)||'AL';localStorage.setItem('tarim_session_v73',u);localStorage.setItem('tarim_token_v73','offline_'+Date.now());if($('authGate'))$('authGate').style.display='none';const h1=$('homeUsernameDisplay');if(h1)h1.textContent='@'+u+' 👑';const h2=$('profileNameDisplay');if(h2)h2.textContent='الإمبراطور '+u;renderAllFeeds();updateCounters();startUesWatchSimulation();toast('أهلاً '+u+' 👑');}
  // FULLSCREEN TRUE + LIKE/COMMENT/GIFT
  function startLive(){state.liveMode=true;state.likes=0;state.lSec=0;initCam();const w=$('cameraWrap');if(w)w.classList.add('fullscreen-live');document.documentElement.classList.add('live-active');document.body.classList.add('live-active');$('liveBadge')?.classList.remove('hidden');$('liveControlsFull')?.classList.remove('hidden');$('endLiveTopBtn')?.classList.remove('hidden');$('normalControls')?.classList.add('hidden');document.querySelector('header')?.classList.add('hidden');document.querySelector('nav')?.classList.add('hidden');state.liveInt=setInterval(()=>{state.lSec++;const m=String(Math.floor(state.lSec/60)).padStart(2,'0');const s=String(state.lSec%60).padStart(2,'0');const t=$('liveTimer');if(t)t.textContent=`${m}:${s}`;},1000);toast('🔴 بث ملء الشاشة 100% - شغال');}
  function stopLive(){state.liveMode=false;const w=$('cameraWrap');if(w)w.classList.remove('fullscreen-live');document.documentElement.classList.remove('live-active');document.body.classList.remove('live-active');$('liveBadge')?.classList.add('hidden');$('liveControlsFull')?.classList.add('hidden');$('endLiveTopBtn')?.classList.add('hidden');$('normalControls')?.classList.remove('hidden');document.querySelector('header')?.classList.remove('hidden');document.querySelector('nav')?.classList.remove('hidden');stopStream();toast('⏹️ تم إنهاء البث');}
  // العمليات FULL
  function openMap(){const c=$('mapContainer');if(c){c.classList.toggle('hidden');if(!c.classList.contains('hidden')&&!state.map&&window.L){state.map=L.map(c).setView([16.0545,49.0],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map);L.marker([16.0545,49.0]).addTo(state.map).bindPopup('📍 تريم').openPopup();}toast('🗺️ خريطة تريم');}}
  function showQR(){const d=$('qrDisplay');if(d){d.classList.toggle('hidden');const b=$('operationsQrBox');if(b&&!d.classList.contains('hidden')){b.textContent='';if(window.QRCode)new QRCode(b,{text:'https://tarimos.org',width:100,height:100});}toast('🔐 QR');}}
  function openOkx(){toast('💳 OKX: 0x53...ab96 - الرصيد 0');showSubPage('okx-page');}
  function openActivity(){if($('activityPosts'))$('activityPosts').textContent=getPosts().length;showSubPage('activity-page');}
  function openOffline(){toast('📹 دون اتصال - 0 فيديو');showSubPage('offline-page');}
  function openCommerce(){toast('👥 المجموعة التجارية - قريباً');showSubPage('commerce-page');}
  function openPromo(){toast('📢 الترويج - 89% تفاعل');showSubPage('promo-page');}
  function openAccountSettings(){showSubPage('account-settings');}
  function openSecurity(){showSubPage('security-settings');}
  function openQrPage(){showSubPage('qr-page');}

  document.addEventListener('DOMContentLoaded',()=>{
    const map={startLive,stopLive,switchCam,capturePhoto,filterNone:()=>setFilter('none'),filterBeauty:()=>setFilter('beauty'),tabHome:(b)=>switchTab('home',b),tabOperations:(b)=>switchTab('operations',b),tabCreate:(b)=>switchTab('create',b),tabInbox:(b)=>switchTab('inbox',b),tabProfile:(b)=>switchTab('profile',b),backToProfile,openAccountSettings,openSecurity,openQrPage,openOkx,openActivity,openOffline,openCommerce,openPromo,openMap,showQR,goInbox:()=>switchTab('inbox')};
    document.addEventListener('click',(e)=>{const btn=e.target.closest('[data-action]');if(!btn)return;const act=btn.getAttribute('data-action');if(map[act])map[act](btn);});
    $('loginBtn')?.addEventListener('click',forceUnlockCastle);
    $('userPass')?.addEventListener('keydown',e=>{if(e.key==='Enter')forceUnlockCastle();});
    $('publishBtn')?.addEventListener('click',publishPost);
    $('startLiveBtn')?.addEventListener('click',startLive);
    $('stopLiveBtn')?.addEventListener('click',stopLive);
    $('stopLiveBtnFull')?.addEventListener('click',stopLive);
    $('endLiveTopBtn')?.addEventListener('click',stopLive);
    $('likeLiveBtnFull')?.addEventListener('click',()=>{state.likes++;const c=$('likeCountFull');if(c)c.textContent=state.likes;const t=$('liveLikesTop');if(t)t.textContent=state.likes;const g=$('giftAnim');if(g){g.textContent='❤️';setTimeout(()=>g.textContent='',800);}toast('❤️ '+state.likes);});
    $('sendGiftBtnFull')?.addEventListener('click',()=>{const g=$('giftAnim');if(g){g.textContent='🎁💎👑';setTimeout(()=>g.textContent='',1500);}toast('🎁 هدية ملكية!');});
    $('sendLiveCommentBtn')?.addEventListener('click',()=>{const inp=$('liveCommentInput');const list=$('liveComments');if(!inp||!inp.value.trim()||!list)return;const d=document.createElement('div');d.textContent='👑 '+sanitizeText(inp.value,100);d.className='bg-black/40 p-1 rounded text-white';list.appendChild(d);inp.value='';list.scrollTop=list.scrollHeight;});
    $('logoutBtn')?.addEventListener('click',()=>{localStorage.clear();location.reload();});
    if(localStorage.getItem('tarim_session_v73')){if($('authGate'))$('authGate').style.display='none';renderAllFeeds();updateCounters();startUesWatchSimulation();}
  });
})();
