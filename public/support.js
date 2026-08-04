// فريق الدعم الفني - TARIM OS
const supportReplies = {
  "بث": "تأكد من السماح للكاميرا، ثم اضغط بدء بث سيادي 🔴",
  "خريطة": "خريطة حضرموت تعمل الآن، قريباً Offline كاملة 🗺️",
  "سلام": "وعليكم السلام يا ملك TARIM OS 👑"
};

function startSupport() {
  const msg = prompt("أهلاً بك في الدعم الفني 🛡️، ايش مشكلتك؟");
  if(!msg) return;
  let reply = "تم استلام رسالتك، فريق الدعم يراجعها 🛡️";
  for(let k in supportReplies){
    if(msg.includes(k)) reply = supportReplies[k];
  }
  alert(reply);
}

// ربط الزر
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[data-support]') || document.getElementById('support-btn');
  if(btn) btn.addEventListener('click', startSupport);
});
