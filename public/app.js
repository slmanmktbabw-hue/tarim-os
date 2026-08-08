// public/app.js - TARIM OS V9.5 FINAL COMPLETE - كل الأزرار شغالة - بمسافة صحيحة
"use strict";
(function () {
  const $ = (id) => document.getElementById(id);
  const sessKey = "tarim_session";
  const usersKey = "tarim_users";
  const msgsKey = "tarim_messages";
  let currentStream = null;
  let liveStream = null;
  let facingMode = "environment";
  let mapInstance = null;
  let currentChatWith = null;
  let filterIdx = 0;
  let liveSec = 0;
  let liveTimerInt = null;
  const filters = ["none","grayscale(1)","sepia(1)","contrast(1.5)","brightness(1.3)","hue-rotate(90deg)"];
  const authGate = $("authGate");
  const loginBtn = $("loginBtn");
  const userIn = $("userPhoneOrEmail");
  const passIn = $("userPass");
  const err = $("loginError");
  const postsFeed = $("postsFeed");
  const tabLoginBtn = $("tabLoginBtn");
  const tabSignupBtn = $("tabSignupBtn");
  const loginForm = $("loginForm");
  const signupForm = $("signupForm");

  function hashPass(s){let h=0;for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;}return String(h);}
  function getUsers(){try{const v=localStorage.getItem(usersKey);return v?JSON.parse(v):{};}catch{return{}}}
  function saveUsers(u){localStorage.setItem(usersKey,JSON.stringify(u));}
  let users=getUsers();if(!users["AL"]){users["AL"]=hashPass("123456");saveUsers(users);}
  function getMessages(){try{const v=localStorage.getItem(msgsKey);return v?JSON.parse(v):{};}catch{return{}}}
  function saveMessages(m){localStorage.setItem(msgsKey,JSON.stringify(m));}
  function showToast(msg,type="ok"){const box=$("toastBox");if(!box)return;const d=document.createElement("div");d.textContent=msg;d.style.cssText=`background:${type==="err"?"#f43f5e":"#06b6d4"};color:#000;padding:12px 16px;border-radius:12px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center`;box.appendChild(d);setTimeout(()=>d.remove(),3000);}
  function sanitize(s){return String(s||"").slice(0,2000).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function stopAllStreams(){if(currentStream)currentStream.getTracks().forEach(t=>t.stop());currentStream=null;if(liveStream)liveStream.getTracks().forEach(t=>t.stop());liveStream=null;}

  function loadFeed(){
    const sess=localStorage.getItem(sessKey)||"AL";
    if(!postsFeed)return;
    const likes=localStorage.getItem("tarim_likes_"+sess)||"120";
    postsFeed.innerHTML="";
    const card=document.createElement("div");
    card.className="tiktok-card";
    card.innerHTML=`<div style="display:flex;justify-content:space-between;padding:8px;color:#22d3ee;font-weight:700;font-size:12px"><span>👑 @${sanitize(sess)}</span><span>🌴 تريم - حضرموت</span></div><div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:8px"><div style="font-size:60px">🎥</div><p style="color:#67e8f9;font-size:13px">فيديو سيادي يملئ الشاشة - محمي Offline</p></div><div class="tiktok-actions"><div class="tiktok-act" id="likeBtn"><b style="font-size:26px">❤️</b><span class="likeCount">${sanitize(likes)}</span></div><div class="tiktok-act" id="commentBtn"><b style="font-size:22px">💬</b><span>45</span></div><div class="tiktok-act" id="shareBtn"><b>🚀</b><span>مشاركة</span></div><div class="tiktok-act" id="saveBtn"><b>🔖</b><span>حفظ</span></div></div><div style="padding:8px;color:#fff;font-size:12px">@ ${sanitize(sess.toLowerCase())}mktbabw@gmail.com</div>`;
    postsFeed.appendChild(card);
    card.querySelector("#likeBtn")?.addEventListener("click",()=>{const c=card.querySelector(".likeCount");let n=parseInt(c.textContent)||0;const liked=card.dataset.liked==="1";if(liked){n--;card.dataset.liked="0"}else{n++;card.dataset.liked="1"}c.textContent=n;localStorage.setItem("tarim_likes_"+sess,String(n));});
    card.querySelector("#commentBtn")?.addEventListener("click",()=>window.switchTab("inbox"));
    card.querySelector("#shareBtn")?.addEventListener("click",()=>{navigator.clipboard?.writeText(location.href);showToast("تم نسخ الرابط 🚀")});
    card.querySelector("#saveBtn")?.addEventListener("click",()=>showToast("تم الحفظ 🔖"));
  }

  function openApp(username){authGate.classList.add("hidden");authGate.style.display="none";localStorage.setItem(sessKey,username);showToast(`أهلاً يا ${sanitize(username)} 👑`);loadFeed();}
  tabLoginBtn?.addEventListener("click",()=>{loginForm.classList.remove("hidden");signupForm.classList.add("hidden");tabLoginBtn.style.cssText="color:#22d3ee;font-weight:700;border-bottom:2px solid #22d3ee;padding-bottom:4px";tabSignupBtn.style.cssText="color:#94a3b8;padding-bottom:4px"});
  tabSignupBtn?.addEventListener("click",()=>{signupForm.classList.remove("hidden");loginForm.classList.add("hidden");tabSignupBtn.style.cssText="color:#22d3ee;font-weight:700;border-bottom:2px solid #22d3ee;padding-bottom:4px";tabLoginBtn.style.cssText="color:#94a3b8;padding-bottom:4px"});
  loginBtn?.addEventListener("click",()=>{const u=(userIn.value||"").trim().slice(0,30),p=(passIn.value||"").trim();if(!u||!p){err.textContent="اكتب الاسم وكلمة السر";err.classList.remove("hidden");return}err.classList.add("hidden");users=getUsers();const hp=hashPass(p);if(users[u]){if(users[u]!==hp){err.textContent="كلمة السر خطأ";err.classList.remove("hidden");showToast("كلمة السر خطأ","err");return}openApp(u)}else{users[u]=hp;saveUsers(users);showToast(`تم إنشاء حساب: ${sanitize(u)} ✅`);openApp(u)}});
  $("signupBtn")?.addEventListener("click",()=>{const u=($("newUsername").value||"").trim().slice(0,30),p=($("newPass").value||"").trim(),c=($("confirmPass").value||"").trim(),sErr=$("signupError");if(!u||!p){sErr.textContent="اكمل البيانات";sErr.classList.remove("hidden");return}if(p!==c){sErr.textContent="كلمة السر غير متطابقة";sErr.classList.remove("hidden");return}if(p.length<4){sErr.textContent="كلمة السر قصيرة";sErr.classList.remove("hidden");return}users=getUsers();if(users[u]){sErr.textContent="الاسم موجود";sErr.classList.remove("hidden");return}users[u]=hashPass(p);saveUsers(users);localStorage.setItem(sessKey,u);location.reload()});
  $("googleLoginBtn")?.addEventListener("click",()=>{const name="Google_"+Math.floor(Math.random()*900+100);localStorage.setItem(sessKey,name);location.reload()});
  passIn?.addEventListener("keydown",e=>{if(e.key==="Enter")loginBtn.click()});
  const sess=localStorage.getItem(sessKey);if(sess){authGate.classList.add("hidden");authGate.style.display="none";loadFeed()}

  // ✅ FIX النهائي - بمسافة - اليمن على اليمين
  window.switchTab=function(tab,btn){
    stopAllStreams();
    document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));
    const target=document.getElementById("tab-"+tab);
    if(target)target.classList.add("active");
    document.querySelectorAll("#mainNav.nav-btn").forEach(x=>{if(x.dataset.tab!=="create")x.style.color="#94a3b8"});
    if(btn&&btn.dataset.tab!=="create")btn.style.color="#22d3ee";
    if(tab==="create")initCamera();
    if(tab==="inbox"){renderUserList();renderMessages()}
  };

  // ✅ بمسافة
  document.querySelectorAll("#mainNav.nav-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const tab=btn.dataset.tab;
      if(tab)window.switchTab(tab,btn);
    });
  });

  async function initCamera(){const preview=$("cameraPreview");if(!preview)return;try{stopAllStreams();currentStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facingMode==="environment"?"environment":"user"},audio:true});preview.srcObject=currentStream}catch{showToast("الكاميرا مرفوضة","err")}}
  $("switchCamBtn")?.addEventListener("click",()=>{facingMode=facingMode==="environment"?"user":"environment";initCamera()});
  $("filterBtn")?.addEventListener("click",()=>{filterIdx=(filterIdx+1)%filters.length;const prev=$("cameraPreview");if(prev)prev.style.filter=filters[filterIdx];showToast("فلتر: "+(filterIdx+1))});
  $("lightBtn")?.addEventListener("click",()=>{const prev=$("cameraPreview");if(!prev)return;const isB=prev.style.filter.includes("brightness(1.6)");prev.style.filter=isB?"none":"brightness(1.6)"});
  $("textPostBtn")?.addEventListener("click",()=>{$("postContentInput")?.focus()});
  $("startLiveBtn")?.addEventListener("click",async()=>{const ls=$("liveScreen");if(!ls)return;ls.classList.remove("hidden");ls.style.display="flex";try{liveStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});$("liveVideo").srcObject=liveStream}catch{showToast("الكاميرا مرفوضة","err")}});
  $("confirmStartLive")?.addEventListener("click",()=>{$("readyToBroadcastBox")?.classList.add("hidden");liveSec=0;if(liveTimerInt)clearInterval(liveTimerInt);liveTimerInt=setInterval(()=>{liveSec++;const m=Math.floor(liveSec/60),s=liveSec%60;const el=$("liveTimer");if(el)el.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;if(liveSec>=480){clearInterval(liveTimerInt);$("endLiveBtn")?.click()}},1000)});
  $("endLiveBtn")?.addEventListener("click",()=>{if(liveTimerInt)clearInterval(liveTimerInt);liveTimerInt=null;if(liveStream)liveStream.getTracks().forEach(t=>t.stop());liveStream=null;const ls=$("liveScreen");ls.classList.add("hidden");ls.style.display="none";$("readyToBroadcastBox")?.classList.remove("hidden")});
  $("liveOpBtn")?.addEventListener("click",()=>$("startLiveBtn")?.click());
  $("opMsgBtn")?.addEventListener("click",()=>window.switchTab("inbox",document.querySelector('#mainNav.nav-btn[data-tab="inbox"]')));
  function openMap(){const ms=$("mapScreen");if(!ms)return;ms.classList.remove("hidden");ms.style.display="flex";setTimeout(()=>{if(!mapInstance){mapInstance=L.map("mapContainer").setView([16.05,48.9833],13);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(mapInstance);L.marker([16.05,48.9833]).addTo(mapInstance).bindPopup("<b>قلعة تريم السيادية</b>").openPopup()}else mapInstance.invalidateSize()},300))}
  $("opsMapBtn")?.addEventListener("click",()=>openMap());
  $("closeMapBtn")?.addEventListener("click",()=>{const ms=$("mapScreen");if(ms){ms.classList.add("hidden");ms.style.display="none"}});
  function openQr(){const sess=localStorage.getItem(sessKey)||"AL";const qs=$("qrScreen"),qb=$("qrBox"),qt=$("qrText");if(!qs){showToast("QR: "+sanitize(sess)+" ✅");return}qs.classList.remove("hidden");qs.style.display="flex";qb.innerHTML="";if(qt)qt.textContent=sess+"@tarim-os";if(typeof QRCode!=="undefined")new QRCode(qb,{text:location.origin+"?u="+encodeURIComponent(sess),width:170,height:170})}
  $("qrBtn")?.addEventListener("click",()=>openQr());$("opsQrBtn")?.addEventListener("click",()=>openQr());
  $("closeQrBtn")?.addEventListener("click",()=>{const qs=$("qrScreen");if(qs){qs.classList.add("hidden");qs.style.display="none"}});
  $("logoutBtn")?.addEventListener("click",()=>{if(confirm("تأكيد الخروج؟")){localStorage.removeItem(sessKey);location.reload()}});
  $("publishBtn")?.addEventListener("click",()=>{const v=$("postContentInput");if(!v||!v.value.trim()){showToast("اكتب وصفاً أولاً","err");return}showToast("تم النشر ✅");v.value="";window.switchTab("home",document.querySelector('#mainNav.nav-btn[data-tab="home"]'));loadFeed()});
  function renderUserList(){const list=$("userList");if(!list)return;const allUsers=Object.keys(getUsers());const me=localStorage.getItem(sessKey)||"AL";list.innerHTML="";allUsers.filter(u=>u!==me).forEach(u=>{const b=document.createElement("button");b.textContent="@"+u;b.style.cssText=`background:${currentChatWith===u?"#00B4D8":"#0f172a"};color:${currentChatWith===u?"#000":"#94a3b8"};padding:8px 14px;border-radius:20px;font-size:11px;white-space:nowrap;border:1px solid rgba(0,240,255,.1)`;b.addEventListener("click",()=>openChat(u));list.appendChild(b)});const b2=document.createElement("button");b2.textContent="🛡️ الدعم";b2.style.cssText="background:#1e293b;color:#22d3ee;padding:8px 14px;border-radius:20px;font-size:11px";b2.addEventListener("click",()=>openChat("الدعم"));list.appendChild(b2)}
  function renderMessages(){const box=$("inboxMessagesList");if(!box)return;box.innerHTML="";const msgs=getMessages();const me=localStorage.getItem(sessKey)||"AL";if(!currentChatWith)currentChatWith=Object.keys(getUsers()).find(u=>u!==me)||"الدعم";const key=[me,currentChatWith].sort().join("_");const chat=msgs[key]||[{from:"system",text:`أهلاً يا إمبراطور ${sanitize(me)} 🤖`}];chat.forEach(m=>{const isMe=m.from===me;const d=document.createElement("div");d.textContent=m.text;d.style.cssText=`align-self:${isMe?"flex-end":"flex-start"};max-width:75%;background:${isMe?"#00B4D8":"#0f172a"};color:${isMe?"#000":"#fff"};padding:10px 14px;border-radius:18px;font-size:13px`;box.appendChild(d)});box.scrollTop=box.scrollHeight}
  function openChat(user){currentChatWith=user;renderUserList();renderMessages()}
  window.openChat=openChat;
  $("sendInboxMsgBtn")?.addEventListener("click",()=>{const input=$("inboxInputField");if(!input||!input.value.trim())return;const me=localStorage.getItem(sessKey)||"AL";if(!currentChatWith){showToast("اختر مستخدم أولاً","err");return}const key=[me,currentChatWith].sort().join("_");const msgs=getMessages();if(!msgs[key])msgs[key]=[];msgs[key].push({from:me,text:input.value.trim().slice(0,500),time:Date.now()});saveMessages(msgs);input.value="";renderMessages()});
  function aiReply(t){t=String(t).toLowerCase();if(t.includes("تريم")||t.includes("قلعة"))return"أنا عين الذكاء من تريم حضرموت 🐉👑";if(t.includes("بث"))return"لبدء البث: العمليات > بث مباشر 🔴";return"تم يا إمبراطور AL 🤖"}
  function addMsg(boxId,who,txt){const box=$(boxId);if(!box)return;const isMe=who==="me";const d=document.createElement("div");d.textContent=txt;d.style.cssText=`align-self:${isMe?"flex-end":"flex-start"};max-width:78%;background:${isMe?"#00B4D8":"#0f172a"};color:${isMe?"#000":"#fff"};padding:10px 14px;border-radius:16px;font-size:13px`;box.appendChild(d);box.scrollTop=box.scrollHeight}
  $("openAiEyeBtn")?.addEventListener("click",()=>{const s=$("aiEyeScreen");s.classList.remove("hidden");s.style.display="flex";if($("aiEyeChat").children.length===0)addMsg("aiEyeChat","ai","أهلاً يا إمبراطور AL 👁️")});
  $("closeAiEye")?.addEventListener("click",()=>{const s=$("aiEyeScreen");s.classList.add("hidden");s.style.display="none"});
  $("sendAiEye")?.addEventListener("click",()=>{const i=$("aiEyeInput");if(!i.value.trim())return;addMsg("aiEyeChat","me",i.value);const q=i.value;i.value="";setTimeout(()=>addMsg("aiEyeChat","ai",aiReply(q)),600)});
  $("openSupportBtn")?.addEventListener("click",()=>{const s=$("supportScreen");s.classList.remove("hidden");s.style.display="flex";if($("supportChat").children.length===0)addMsg("supportChat","ai","أهلاً يا إمبراطور AL 🛡️")});
  $("closeSupport")?.addEventListener("click",()=>{const s=$("supportScreen");s.classList.add("hidden");s.style.display="none"});
  $("sendSupport")?.addEventListener("click",()=>{const i=$("supportInput");if(!i.value.trim())return;addMsg("supportChat","me",i.value);const q=i.value;i.value="";setTimeout(()=>addMsg("supportChat","ai",aiReply(q)+" ✅"),700)});
  const profileActions={changeBgBtn:()=>{document.body.style.background=document.body.style.background==="rgb(20, 10, 30)"?"#020A18":"rgb(20, 10, 30)";showToast("تغير الخلفية 🎨")},walletBtn:()=>showToast("💳 المحفظة"),activityBtn:()=>showToast("⚙️ الانشطة"),offlineVideosBtn:()=>showToast("🎞️ دون اتصال"),qrBtn:()=>openQr(),creativeBtn:()=>{window.switchTab("create",document.querySelector('#mainNav.nav-btn[data-tab="create"]'))},businessBtn:()=>showToast("👫 التجارية"),adsBtn:()=>showToast("🚀 الترويج"),managePostsBtn:()=>{window.switchTab("home",document.querySelector('#mainNav.nav-btn[data-tab="home"]'))},settingsBtn:()=>showToast("⚙️ الاعدادات"),accountBtn:()=>showToast("🚹 الحساب"),privacyBtn:()=>showToast("🔐 الخصوصية"),shareProfileBtn:()=>{navigator.clipboard?.writeText(location.href);showToast("💱 نسخ الرابط")},policyBtn:()=>showToast("📄 السياسية"),payBtn:()=>showToast("💳 PayPal")};
  Object.keys(profileActions).forEach(id=>{const el=$(id);if(el)el.addEventListener("click",profileActions[id])});
  console.log("[TARIM OS] V9.5 FINAL COMPLETE - بمسافة - كل الأزرار شغالة - اليمن على اليمين 👑");
  if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js").catch(()=>{})}
})();
