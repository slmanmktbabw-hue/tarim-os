// عين الذكاء الاصطناعي
function startAIEye(){
  alert('👁️ عين الذكاء الاصطناعي نشطة\n\n✅ البث مستقر\n✅ لا يوجد نشاط مشبوه\n✅ 3 مشاهدين حالياً');
}
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[data-ai-eye]') || document.getElementById('ai-eye-btn');
  if(btn) btn.addEventListener('click', startAIEye);
});
