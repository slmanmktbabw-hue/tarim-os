// V8.7 TIKTOK FEED + FULLSCREEN LIVE PRO - الرئيسية منشورات الجمهور + بث كامل 100% + إعجاب/تعليق/هدية (أمن ومحسن)
"use strict";
(function(){
const $=id=>document.getElementById(id);
function toast(m){const b=$('toastBox');if(!b)return;const e=document.createElement('div');e.textContent=String(m).slice(0,200);e.style.cssText='background:#00B4D8;color:#000;padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center';b.appendChild(e);setTimeout(()=>e.remove(),3000);}
function sanitize(t,l=1000){return String(t||"").slice(0,l).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}

const DEMO_POSTS=[
{id:101,username:'مطبخ_تريم',avatar:'🍲',content:'كبسة حضرمية على أصولها - مطبخ الوالدة في تريم 🌴 #تريم',likes:342,comments:28,shares:12,isLive:false,color:'#FF6B35',viewers:0},
{id:102,username:'AL_الامبراطور',avatar:'👑',content:'بث مباشر سيادي - TARIM OS V8.7 TIKTOK FEED 🔥',likes:1205,comments:89,shares:45,isLive:true,viewers:156,color:'#FF0000'},
{id:103,username:'صقور_حضرموت',avatar:'🦅',content:'أهداف اليوم تريم vs سيئون 3-1 ⚽🔥',likes:892,comments:56,shares:23,isLive:false,color:'#1E90FF',viewers:0},
{id:104,username:'تراثنا',avatar:'🏺',content:'بيت الطين 300 سنة - تريم القديمة 🏰',likes:567,comments:34,shares:18,isLive:false,color:'#8B4513',viewers:0},
{id:105,username:'تاجر_العسل',avatar:'🍯',content:'عسل سدر حضرمي ملكي قطفة اليوم 💬',likes:234,comments:19,shares:8,isLive:false,color:'#DAA520',viewers:0},
{id:106,username:'بنت_تريم',avatar:'🌸',content:'جولة في سوق تريم القديم 🌴✨',likes:445,comments:22,shares:9,isLive:false,color:'#FF69B4',viewers:0},
];

let state={curStream:null,facing:'user',liveInt:null,lSec:0,liveMode:false,likes:0,watchTimer:null,abortCtrl:null};

function stopStream(){
 if(state.curStream) { state.curStream.getTracks().forEach(t=>t.stop()); }
 state.curStream=null;
 if(state.liveInt) clearInterval(state.liveInt);
 state.liveInt=null;
 if(state.watchTimer) clearInterval(state.watchTimer);
 if(state.abortCtrl) state.abortCtrl.abort();
}

function startUes(){
 if(state.watchTimer) clearInterval(state.watchTimer);
 if(state.abortCtrl) state.abortCtrl.abort();
 state.abortCtrl=new AbortController();
 let wt=0;
 state.watchTimer=setInterval(async()=>{
  wt+=5;
  if(wt>=20){
   clearInterval(state.watchTimer);
   try{
    const r=await fetch('/get_next_video',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     signal:state.abortCtrl.signal,
     body:JSON.stringify({user_profile:{country:'YE'},current_video:{duration:45,watch_time:wt}})
    });
    const d=await r.json();
    if(d&&d.video_id) toast('⚡ '+String(d.video_id).slice(0,30));
   }catch(err){/* تجاهل الأخطاء الصامتة للإلغاء */}
  }
 },5000);
}

function startLive(){
 state.liveMode=true; state.lSec=0; state.likes=0;
 const w=$('cameraWrap'); if(w)w.classList.add('fullscreen-live');
 document.documentElement.classList.add('live-active');
 document.body.classList.add('live-active');
 initCam();
 $('liveBadge')?.classList.remove('hidden');
 $('liveControlsFull')?.classList.remove('hidden');
 $('endLiveTopBtn')?.classList.remove('hidden');
 $('normalControls')?.classList.add('hidden');
 document.querySelector('header')?.classList.add('hidden');
 document.querySelector('nav')?.classList.add('hidden');
 
 state.liveInt=setInterval(()=>{
  state.lSec++;
  const m=String(Math.floor(state.lSec/60)).padStart(2,'0');
  const s=String(state.lSec%60).padStart(2,'0');
  const t=$('liveTimer');
  if(t) t.textContent=`${m}:${s}`;
 },1000);
 toast('🔴 بث ملء الشاشة 100% - شغال');
}

function stopLive(){
 state.liveMode=false;
 const w=$('cameraWrap'); if(w)w.classList.remove('fullscreen-live');
 document.documentElement.classList.remove('live-active');
 document.body.classList.remove('live-active');
 $('liveBadge')?.classList.add('hidden');
 $('liveControlsFull')?.classList.add('hidden');
 $('endLiveTopBtn')?.classList.add('hidden');
 $('normalControls')?.classList.remove('hidden');
 document.querySelector('header')?.classList.remove('hidden');
 document.querySelector('nav')?.classList.remove('hidden');
 stopStream();
 toast('⏹️ انتهى البث');
}

function switchTab(name,btn){
 if(state.liveMode){toast('🔴 أنهي البث أولاً');return;}
 stopStream();
 document.querySelectorAll('.tab-content').forEach(t=>{t.classList.remove('active');t.classList.add('hidden');});
 const tar=$('tab-'+name); if(tar){tar.classList.remove('hidden');tar.classList.add('active');}
 document.querySelectorAll('.nav-btn').forEach(b=>{b.classList.remove('text-cyan-400');b.classList.add('text-slate-400');});
 if(btn)btn.classList.add('text-cyan-400');
 if(name==='create')initCam();
 if(name==='home'){renderFeeds();startUes();}
}

async function initCam(){
 const v=$('cameraPreview');
 if(!v)return;
 try{
  if(state.curStream)state.curStream.getTracks().forEach(t=>t.stop());
  state.curStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:state.facing,width:{ideal:1280},height:{ideal:720}},audio:true});
  v.srcObject=state.curStream;
  await v.play().catch(()=>{});
 }catch{toast('الكاميرا تحتاج HTTPS أو صلاحية وصول');}
}

function setFilter(t){
 const v=$('cameraPreview');
 if(v)v.style.filter=t==='beauty'?'contrast(1.15) brightness(1.15) saturate(1.2)':'none';
}

function switchCam(){
 state.facing=state.facing==='user'?'environment':'user';
 initCam();
}

function getPosts(){
 try{
  const d=localStorage.getItem('tarim_posts_v73');
  if(!d)return[];
  const a=JSON.parse(d);
  return Array.isArray(a)?a.slice(-100):[];
 }catch{return[];}
}

function savePosts(p){
 try{
  localStorage.setItem('tarim_posts_v73',JSON.stringify(p.slice(-100)));
 }catch{toast('ممتلئ التخزين المحلي');}
}

function renderFeeds(){
 const f=$('postsFeed');
 const liveBox=$('activeLivesFeed');
 if(!f)return;
 f.textContent='';
 if(liveBox)liveBox.textContent='';
 
 const userPosts=getPosts();
 const all=[...userPosts.reverse().map(p=>({...p,isUser:true,likes:p.likes||0,comments:0,shares:0,color:'#00B4D8',avatar:'👑',viewers:0})),...DEMO_POSTS];
 
 if(liveBox){
  const lives=all.filter(p=>p.isLive);
  if(lives.length){
   const t=document.createElement('div');
   t.className='text-[10px] text-rose-400 font-bold mb-2';
   t.textContent='🔴 مباشر الآن • '+lives.length;
   liveBox.appendChild(t);
   
   lives.forEach(p=>{
    const el=document.createElement('div');
    el.className='glass p-3 rounded-xl border border-rose-500/40 flex justify-between items-center mb-2 cursor-pointer';
    
    const leftDiv=document.createElement('div');
    leftDiv.className='flex items-center gap-2';
    const avDiv=document.createElement('div');
    avDiv.className='w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white';
    avDiv.textContent=sanitize(p.avatar, 5);
    
    const infoDiv=document.createElement('div');
    infoDiv.className='text-right';
    const userTitle=document.createElement('div');
    userTitle.className='text-xs font-bold';
    userTitle.textContent='@'+sanitize(p.username,20);
    const viewersCount=document.createElement('div');
    viewersCount.className='text-[9px] text-rose-300';
    viewersCount.textContent='👁️ '+Number(p.viewers||0)+' يشاهد';
    
    infoDiv.appendChild(userTitle);
    infoDiv.appendChild(viewersCount);
    leftDiv.appendChild(avDiv);
    leftDiv.appendChild(infoDiv);
    
    const badge=document.createElement('div');
    badge.className='text-[10px] bg-rose-500 text-white px-3 py-1 rounded-full';
    badge.textContent='دخول';
    
    el.appendChild(leftDiv);
    el.appendChild(badge);
    el.addEventListener('click',()=>toast('🔴 دخلت بث @'+sanitize(p.username,20)));
    liveBox.appendChild(el);
   });
  }
 }
 
 all.forEach(p=>{
  const card=document.createElement('div');
  card.className='glass rounded-2xl overflow-hidden border border-cyan-500/20 mb-4';
  
  const h=document.createElement('div');
  h.className='p-3 flex justify-between items-center';
  const u=document.createElement('div');
  u.className='flex items-center gap-2';
  
  const av=document.createElement('div');
  av.className='w-9 h-9 rounded-full flex items-center justify-center font-bold text-white';
  av.style.background=p.color || '#333';
  av.textContent=sanitize(p.avatar,5);
  
  const nd=document.createElement('div');
  nd.className='text-right';
  nd.innerHTML=`<div class="text-xs font-bold">@${sanitize(p.username,20)}</div><div class="text-[9px] text-slate-400">${p.isLive?'🔴 مباشر • تريم':'📍 تريم'}</div>`;
  
  u.appendChild(av);
  u.appendChild(nd);
  
  const follow=document.createElement('button');
  follow.className='text-[10px] border border-cyan-500/40 text-cyan-400 px-3 py-1 rounded-full';
  follow.textContent=p.isUser?'أنت':'متابعة';
  follow.addEventListener('click',()=>{follow.textContent=follow.textContent==='متابعة'?'تم ✅':'متابعة';});
  
  h.appendChild(u);
  h.appendChild(follow);
  
  const video=document.createElement('div');
  video.className='w-full h-[42vh] relative flex items-center justify-center';
  video.style.background=p.isLive?'linear-gradient(135deg,#FF0000,#8B0000)':`linear-gradient(135deg,${p.color || '#000'},#030B1A)`;
  
  const innerVidDiv=document.createElement('div');
  innerVidDiv.className='text-center p-4';
  innerVidDiv.innerHTML=`<div class="text-5xl mb-2">${p.isLive?'🔴':sanitize(p.avatar,5)}</div>`;
  
  const contentSpan=document.createElement('div');
  contentSpan.className='text-xs font-bold text-white max-w-[80%] mx-auto';
  contentSpan.textContent=sanitize(p.content,120);
  innerVidDiv.appendChild(contentSpan);
  video.appendChild(innerVidDiv);
  
  if(p.isLive){
   const liveTag=document.createElement('div');
   liveTag.className='absolute top-2 left-2 bg-rose-500 text-white text-[9px] px-2 py-1 rounded-full animate-pulse';
   liveTag.textContent='🔴 LIVE';
   video.appendChild(liveTag);
  }
  
  const act=document.createElement('div');
  act.className='p-3';
  
  const desc=document.createElement('p');
  desc.className='text-xs text-slate-200 mb-3 text-right';
  desc.textContent=sanitize(p.content,200);
  
  const btns=document.createElement('div');
  btns.className='flex justify-between text-[11px]';
  const left=document.createElement('div');
  left.className='flex gap-4';
  
  const like=document.createElement('button');
  like.className='text-slate-400';
  like.innerHTML=`❤️ ${Number(p.likes)}`;
  like.addEventListener('click',()=>{
   p.likes++;
   like.innerHTML=`❤️ ${Number(p.likes)}`;
   const tl=$('liveLikesTop'); if(tl)tl.textContent=p.likes;
   toast('❤️ إعجاب');
  });
  
  const comm=document.createElement('button');
  comm.className='text-slate-400';
  comm.innerHTML=`💬 ${Number(p.comments)}`;
  comm.addEventListener('click',()=>{
   const c=prompt('تعليق:');
   if(c)toast('💬 '+sanitize(c,20));
  });
  
  const share=document.createElement('button');
  share.className='text-slate-400';
  share.innerHTML=`↗️ ${Number(p.shares)}`;
  share.addEventListener('click',()=>{
   p.shares++;
   share.innerHTML=`↗️ ${Number(p.shares)}`;
  });
  
  left.appendChild(like);
  left.appendChild(comm);
  left.appendChild(share);
  
  const right=document.createElement('div');
  right.className='flex gap-2';
  const gift=document.createElement('button');
  gift.className='bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 rounded-full';
  gift.textContent='🎁';
  gift.addEventListener('click',()=>{
   const g=$('giftAnim');
   if(g){g.textContent='🎁💎👑';setTimeout(()=>g.textContent='',1500);}
   toast('🎁 هدية!');
  });
  
  right.appendChild(gift);
  btns.appendChild(left);
  btns.appendChild(right);
  
  act.appendChild(desc);
  act.appendChild(btns);
  
  card.appendChild(h);
  card.appendChild(video);
  card.appendChild(act);
  f.appendChild(card);
 });
}

function publish(){
 const inp=$('postContentInput');
 if(!inp||!inp.value.trim()){toast('اكتب شيئاً');return;}
 const sessionUser=localStorage.getItem('tarim_session_v73')||'AL';
 const post={
  id:Date.now(),
  content:sanitize(inp.value,1000),
  username:sanitize(sessionUser,30),
  avatar:'👑',
  createdAt:new Date().toISOString(),
  likes:0,comments:0,shares:0,isUser:true,color:'#00B4D8',viewers:0
 };
 const all=getPosts();
 all.push(post);
 savePosts(all);
 inp.value='';
 renderFeeds();
 switchTab('home');
 toast('🚀 نشر في الرئيسية');
}

function unlock(){
 const phoneInput=$('userPhoneOrEmail');
 const u=sanitize(phoneInput?.value||'AL',30)||'AL';
 localStorage.setItem('tarim_session_v73',u);
 const authGate=$('authGate');
 if(authGate)authGate.style.display='none';
 const h1=$('homeUsernameDisplay');
 if(h1)h1.textContent='@'+u+' 👑';
 renderFeeds();
 startUes();
}

document.addEventListener('DOMContentLoaded',()=>{
 const map={
  startLive,
  stopLive,
  switchCam,
  filterNone:()=>setFilter('none'),
  filterBeauty:()=>setFilter('beauty'),
  tabHome:(b)=>switchTab('home',b),
  tabOperations:(b)=>switchTab('operations',b),
  tabCreate:(b)=>switchTab('create',b),
  tabInbox:(b)=>switchTab('inbox',b),
  tabProfile:(b)=>switchTab('profile',b),
  backToProfile:()=>{},
  openMap:()=>{
   const c=$('mapContainer');
   if(c){
    c.classList.toggle('hidden');
    if(!c.classList.contains('hidden')&&!state.map&&window.L){
     state.map=L.map(c).setView([16.0545,49.0],14);
     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map);
    }
   }
  },
  showQR:()=>{const d=$('qrDisplay');if(d)d.classList.toggle('hidden');},
  goInbox:()=>switchTab('inbox')
 };

 document.addEventListener('click',(e)=>{
  const b=e.target.closest('[data-action]');
  if(!b)return;
  const a=b.getAttribute('data-action');
  if(map[a])map[a](b);
 });

 $('loginBtn')?.addEventListener('click',unlock);
 $('publishBtn')?.addEventListener('click',publish);
 $('startLiveBtn')?.addEventListener('click',startLive);
 $('stopLiveBtn')?.addEventListener('click',stopLive);
 $('stopLiveBtnFull')?.addEventListener('click',stopLive);
 $('endLiveTopBtn')?.addEventListener('click',stopLive);
 
 $('likeLiveBtnFull')?.addEventListener('click',()=>{
  state.likes++;
  const c=$('likeCountFull'); if(c)c.textContent=state.likes;
  const t=$('liveLikesTop'); if(t)t.textContent=state.likes;
  const g=$('giftAnim'); if(g){g.textContent='❤️';setTimeout(()=>g.textContent='',800);}
  toast('❤️ '+state.likes);
 });
 
 $('sendGiftBtnFull')?.addEventListener('click',()=>{
  const g=$('giftAnim');
  if(g){g.textContent='🎁💎👑';setTimeout(()=>g.textContent='',1500);}
  toast('🎁 هدية ملكية!');
 });
 
 $('sendLiveCommentBtn')?.addEventListener('click',()=>{
  const inp=$('liveCommentInput');
  const list=$('liveComments');
  if(!inp||!inp.value.trim()||!list)return;
  const d=document.createElement('div');
  d.textContent='👑 '+sanitize(inp.value,100);
  d.className='bg-black/40 p-1 rounded text-white';
  list.appendChild(d);
  inp.value='';
  list.scrollTop=list.scrollHeight;
 });

 if(localStorage.getItem('tarim_session_v73')){
  if($('authGate'))$('authGate').style.display='none';
  renderFeeds();
 }else{
  renderFeeds();
 }
});
})();
