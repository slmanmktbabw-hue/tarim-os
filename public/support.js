// ==============================================================================
// public/support.js - TARIM OS V8.7 & SOUQ AL MOLOUK - SECURE SUPPORT ENGINE
// محرك الدعم السيادي الآمن - مختوم بالمسك 👑🛡️
// ==============================================================================
"use strict";

let isOpen = false;
let castleSupportInstance = null;

// أداة هروب آمنة ضد XSS
function safeText(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML; // أو استخدم textContent مباشرة عند الإنشاء
}
function createSafeMessageElement(text, className) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text; // textContent هو الحل، وليس innerHTML
  return el;
}
function safeGetLogs() {
  try {
    const raw = localStorage.getItem('souq_support_logs');
    return raw? JSON.parse(raw) : [];
  } catch { return []; }
}

// ==========================================
// 1. نظام الدعم السيادي (Modal)
// ==========================================
function createSupportModal() {
    if (document.getElementById('supportModal')) return;
    const modal = document.createElement('div');
    modal.id = 'supportModal';
    modal.className = 'hidden fixed inset-0 z-[10002] bg-black/90 backdrop-blur-sm p-4 items-center justify-center';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.display = 'none';

    const box = document.createElement('div');
    box.className = 'glass w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl border border-yellow-500/30';
    box.style.cssText = 'background:rgba(15,23,42,.96);backdrop-filter:blur(14px);border:1px solid rgba(255,215,0,.3);border-radius:24px;padding:24px';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,215,0,.15);padding-bottom:16px;margin-bottom:16px';

    const title = document.createElement('h3');
    title.style.cssText = 'font-size:14px;font-weight:900;color:#ffd700';
    title.textContent = '🛡️ فريق الدعم السيادي وحارس القلعة V8.7';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'closeSupportBtn';
    closeBtn.type = 'button';
    closeBtn.style.cssText = 'color:#94a3b8;background:#0f172a;padding:6px 12px;border-radius:10px;font-size:12px;border:1px solid rgba(255,255,255,.08);cursor:pointer';
    closeBtn.textContent = 'إغلاق ✕';
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex-direction:column;gap:16px;text-align:right';
    const info = document.createElement('div');
    info.style.cssText = 'background:rgba(15,23,42,.7);padding:16px;border-radius:12px;border:1px solid rgba(255,215,0,.1);display:flex;flex-direction:column;gap:8px';
    const p1 = document.createElement('p');
    p1.style.cssText = 'font-size:13px;color:#e2e8f0';
    p1.textContent = 'أهلاً بك يا ملك في مركز قيادة سوق الملوك وحصن قلعة النور (تعز وتريم).';
    const p2 = document.createElement('p');
    p2.style.cssText = 'font-size:11px;color:#94a3b8;line-height:1.8';
    p2.textContent = 'نعمل 24/7 لخدمة طلبيات العطور والبخور الملكي وحماية سيادة متجرك.';
    info.append(p1, p2);

    const actions = document.createElement('div');
    actions.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px';
    const waBtn = document.createElement('a');
    waBtn.href = 'https://wa.me/967770000000?text=سلام%20سوق%20الملوك%20-%20حصن%20قلعة%20النور%20👑';
    waBtn.target = '_blank'; waBtn.rel = 'noopener noreferrer';
    waBtn.style.cssText = 'background:#059669;color:#fff;text-align:center;padding:12px;border-radius:12px;font-size:12px;font-weight:700;display:block;text-decoration:none';
    waBtn.textContent = '💬 واتساب سيادي';
    const mailBtn = document.createElement('a');
    mailBtn.href = 'mailto:king@souq-al-molouk.com?subject=دعم%20سوق%20الملوك%20الملكي';
    mailBtn.style.cssText = 'background:#0f172a;color:#fff;text-align:center;padding:12px;border-radius:12px;font-size:12px;font-weight:700;border:1px solid rgba(255,215,0,.2);display:block;text-decoration:none';
    mailBtn.textContent = '✉️ بريد القلعة';
    actions.append(waBtn, mailBtn);

    const footer = document.createElement('p');
    footer.style.cssText = 'font-size:10px;color:#64748b;text-align:center;margin-top:8px';
    footer.textContent = 'تعز & تريم، اليمن • V8.7 FINAL SEAL • مختوم بالمسك - 2026';

    body.append(info, actions, footer);
    box.append(header, body);
    modal.appendChild(box);
    document.body.appendChild(modal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function openModal() {
    createSupportModal();
    const modal = document.getElementById('supportModal');
    if (!modal) return;
    modal.classList.remove('hidden'); modal.classList.add('flex');
    modal.style.display = 'flex'; isOpen = true;
    document.body.style.overflow = 'hidden';
}
function closeModal() {
    const modal = document.getElementById('supportModal');
    if (!modal) return;
    modal.classList.add('hidden'); modal.classList.remove('flex');
    modal.style.display = 'none'; isOpen = false;
    document.body.style.overflow = '';
}

// ==========================================
// 2. حارس الشات - النسخة الآمنة
// ==========================================
class CastleSupport {
  constructor() {
    this.whatsapp = '967770000000';
    this.email = 'king@souq-al-molouk.com';
    this.isChatOpen = false;
    this.lastMessages = []; // لمنع السبام
    this.init();
  }
  init() { this.createWidget(); this.bindEvents(); }

  createWidget() {
    if (document.getElementById('castle-support')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'castle-support';
    wrapper.innerHTML = `
      <style>
        #castle-support-btn{position:fixed;bottom:20px;right:20px;width:54px;height:54px;background:#ffd700;color:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(255,215,0,.3);z-index:9998;border:2px solid #111;transition:.3s}
        #castle-support-box{position:fixed;bottom:85px;right:20px;width:320px;max-width:90vw;background:#111;border:1px solid rgba(255,215,0,.3);border-radius:16px;z-index:9998;display:none;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,.7)}
        #castle-support-box.open{display:block}
        #castle-support-head{background:#191919;color:#ffd700;padding:12px 15px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2a2a2a;font-size:13px;font-weight:bold}
        #castle-support-body{padding:12px;max-height:340px;overflow-y:auto;font-family:system-ui}
      .support-msg{padding:8px 12px;border-radius:10px;margin-bottom:8px;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
      .support-msg.me{background:#2c1a0a;border:1px solid rgba(255,215,0,.3);margin-left:20px;color:#ddd}
      .support-msg.bot{background:#1a1a1a;border:1px solid #333;margin-right:20px;color:#ddd}
      .support-quick{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}
      .support-quick button{background:#1a1a1a;border:1px solid #333;color:#ffd700;padding:5px 9px;border-radius:16px;font-size:10px;cursor:pointer}
        #support-input-area{display:flex;gap:6px;padding:10px;border-top:1px solid #222;background:#191919}
        #support-input-area input{flex:1;background:#222;border:1px solid #333;color:#fff;padding:8px 12px;border-radius:18px;outline:none;font-size:12px}
        #support-input-area button{background:#ffd700;border:0;padding:8px 14px;border-radius:18px;cursor:pointer;font-weight:bold;color:#111;font-size:12px}
      .support-link{display:block;background:#059669;color:#fff;text-align:center;padding:10px;border-radius:8px;margin-top:10px;text-decoration:none;font-weight:bold;font-size:12px}
      .support-link.email{background:#1f2937;border:1px solid rgba(255,215,0,.2)}
      </style>
      <div id="castle-support-btn" title="حارس القلعة">💬</div>
      <div id="castle-support-box">
        <div id="castle-support-head"><span>🛡️ حارس القلعة - دعم سوق الملوك</span><span id="support-close" style="cursor:pointer">✖️</span></div>
        <div id="castle-support-body">
          <div class="support-msg bot">👑 أهلاً يا ملك! أنا حارس القلعة. كيف أساعدك اليوم؟</div>
          <div class="support-quick">
            <button type="button" data-q="أين طلبي؟">📦 أين طلبي؟</button>
            <button type="button" data-q="كم الشحن؟">🚚 كم الشحن؟</button>
            <button type="button" data-q="هل يوجد دفع عند الاستلام؟">💰 دفع عند الاستلام؟</button>
            <button type="button" data-q="هل المنتجات أصلية؟">✨ هل أصلي؟</button>
          </div>
          <div id="support-chat"></div>
          <a id="support-wa" class="support-link" target="_blank" rel="noopener noreferrer">💬 واتساب مباشر</a>
          <a class="support-link email" href="mailto:king@souq-al-molouk.com">📧 البريد الملكي</a>
        </div>
        <div id="support-input-area">
          <input id="support-input" placeholder="اكتب سؤالك هنا..." maxlength="300" autocomplete="off">
          <button id="support-send" type="button">إرسال</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);
    document.getElementById('support-wa').href = `https://wa.me/${this.whatsapp}?text=${encodeURIComponent('السلام عليكم - سوق الملوك 👑 عندي استفسار')}`;
  }

  bindEvents() {
    const btn = document.getElementById('castle-support-btn');
    const box = document.getElementById('castle-support-box');
    const close = document.getElementById('support-close');
    const input = document.getElementById('support-input');
    const send = document.getElementById('support-send');
    const chat = document.getElementById('support-chat');
    if (!btn ||!box ||!input ||!send ||!chat) return;

    const toggle = () => { this.isChatOpen =!this.isChatOpen; box.classList.toggle('open', this.isChatOpen); };
    btn.addEventListener('click', toggle);
    close.addEventListener('click', toggle);

    const answers = {
      'أين طلبي؟': '📦 اطلب رقم الطلب من السلة أو حسابك، ثم راسلنا عبر واتساب وسنتابع شحنتك فوراً من تعز وتريم.',
      'كم الشحن؟': '🚚 الشحن داخل تعز 1000 ﷼، وخارجها 2000 ﷼. والشحن مجاني للطلبات فوق 20,000 ﷼!',
      'هل يوجد دفع عند الاستلام؟': '💰 نعم بكل تأكيد، الدفع عند الاستلام متاح في جميع محافظات اليمن.',
      'هل المنتجات أصلية؟': '✅ نعم 100%، جميع العطور والبخور والكنوز أصلية يمنية ومخارة بعناية.',
      'default': '🛡️ وصلت رسالتك يا ملك! سيقوم فريق القلعة بالرد عليك فوراً. اضغط واتساب للرد الفوري.'
    };

    const canSend = () => {
      const now = Date.now();
      this.lastMessages = this.lastMessages.filter(t => now - t < 10000);
      if (this.lastMessages.length >= 5) return false;
      this.lastMessages.push(now);
      return true;
    };

    const reply = (text) => {
      let q = (text || '').trim().slice(0, 300);
      if (!q) return;
      if (!canSend()) { alert('تمهل قليلاً يا ملك 👑'); return; }

      // آمن - إنشاء عناصر بـ textContent
      chat.appendChild(createSafeMessageElement(q, 'support-msg me'));

      const key = Object.keys(answers).find(k => q.includes(k)) || 'default';
      const answerText = answers[key];

      setTimeout(() => {
        chat.appendChild(createSafeMessageElement(answerText, 'support-msg bot'));
        const bodyEl = document.getElementById('castle-support-body');
        if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;

        try {
          let logs = safeGetLogs();
          logs.push({ q: q.slice(0,100), a: answerText.slice(0,100), time: new Date().toISOString() });
          localStorage.setItem('souq_support_logs', JSON.stringify(logs.slice(-20)));
        } catch {}
      }, 400);
      input.value = '';
    };

    send.addEventListener('click', () => reply(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') reply(input.value); });
    document.querySelectorAll('.support-quick button').forEach(b => {
      b.addEventListener('click', () => reply(b.dataset.q || ''));
    });
  }
  getLogs() { return safeGetLogs(); }
}

export function initSupport() {
    createSupportModal();
    document.querySelectorAll('#supportBtn, #openSupportBtn').forEach(btn => {
        if (!btn.dataset.bound) {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
        }
    });
    if (!castleSupportInstance && typeof window!== 'undefined') {
        castleSupportInstance = new CastleSupport();
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeModal(); });
}

if (typeof document!== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSupport);
    else initSupport();
}
if (typeof window!== 'undefined') {
    window.TarimSupport = { openModal, closeModal, initSupport };
}
