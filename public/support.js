// public/support.js - TARIM OS V7.4 - Support Fortress Hardened
"use strict";

let isOpen = false;
const SUPPORT_EMAIL = 'support@tarimos.org';
const SUPPORT_WA = '967000000000'; // ضع رقمك الحقيقي في.env وليس هنا

function createSupportModal() {
    if (document.getElementById('supportModal')) return;

    const modal = document.createElement('div');
    modal.id = 'supportModal';
    modal.className = 'hidden fixed inset-0 z-[10002] bg-black/90 backdrop-blur-sm p-4 items-center justify-center';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'فريق الدعم');
    modal.style.display = 'none';

    const box = document.createElement('div');
    box.className = 'glass w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl border border-cyan-500/20';
    // لا تستخدم += أبداً
    box.style.background = 'rgba(10,20,40,.96)';
    box.style.backdropFilter = 'blur(14px)';
    box.style.border = '1px solid rgba(0,240,255,.15)';
    box.style.borderRadius = '24px';
    box.style.padding = '24px';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.borderBottom = '1px solid rgba(255,255,255,.1)';
    header.style.paddingBottom = '16px';
    header.style.marginBottom = '16px';

    const title = document.createElement('h3');
    title.style.fontSize = '13px';
    title.style.fontWeight = '900';
    title.style.color = '#22d3ee';
    title.textContent = '🛡️ فريق الدعم';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = 'closeSupportBtn';
    closeBtn.style.color = '#94a3b8';
    closeBtn.style.background = '#0f172a';
    closeBtn.style.padding = '6px 12px';
    closeBtn.style.borderRadius = '10px';
    closeBtn.style.fontSize = '12px';
    closeBtn.style.border = '1px solid rgba(255,255,255,.08)';
    closeBtn.textContent = 'إغلاق ✕';

    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '16px';
    body.style.textAlign = 'right';

    const info = document.createElement('div');
    info.style.background = 'rgba(15,23,42,.7)';
    info.style.padding = '16px';
    info.style.borderRadius = '12px';
    info.style.border = '1px solid rgba(255,255,255,.05)';

    const p1 = document.createElement('p');
    p1.style.fontSize = '13px';
    p1.style.color = '#e2e8f0';
    p1.textContent = 'أهلاً بك في مركز دعم TARIM OS - نحن هنا لمساعدتك.';

    const p2 = document.createElement('p');
    p2.style.fontSize = '11px';
    p2.style.color = '#94a3b8';
    p2.style.lineHeight = '1.8';
    p2.textContent = 'نعمل على مدار الساعة لحماية تجربتك. متوسط الرد أقل من ساعة.';

    info.append(p1, p2);

    const actions = document.createElement('div');
    actions.style.display = 'grid';
    actions.style.gridTemplateColumns = '1fr 1fr';
    actions.style.gap = '8px';

    const waBtn = document.createElement('a');
    // تنظيف الرقم - فقط أرقام
    const cleanWa = SUPPORT_WA.replace(/[^0-9]/g, '').slice(0,15);
    waBtn.href = `https://wa.me/${cleanWa}?text=${encodeURIComponent('سلام فريق TARIM OS')}`;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer nofollow';
    waBtn.style.background = '#059669';
    waBtn.style.color = '#fff';
    waBtn.style.textAlign = 'center';
    waBtn.style.padding = '12px';
    waBtn.style.borderRadius = '12px';
    waBtn.style.fontSize = '12px';
    waBtn.style.fontWeight = '700';
    waBtn.textContent = '💬 واتساب';

    const mailBtn = document.createElement('a');
    mailBtn.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('دعم TARIM OS')}`;
    mailBtn.rel = 'noopener noreferrer nofollow';
    mailBtn.style.background = '#0f172a';
    mailBtn.style.color = '#fff';
    mailBtn.style.textAlign = 'center';
    mailBtn.style.padding = '12px';
    mailBtn.style.borderRadius = '12px';
    mailBtn.style.fontSize = '12px';
    mailBtn.style.fontWeight = '700';
    mailBtn.style.border = '1px solid rgba(255,255,255,.1)';
    mailBtn.textContent = '✉️ بريد';

    actions.append(waBtn, mailBtn);

    const footer = document.createElement('p');
    footer.style.fontSize = '10px';
    footer.style.color = '#64748b';
    footer.style.textAlign = 'center';
    footer.style.marginTop = '8px';
    footer.textContent = 'TARIM OS - من تريم إلى العالم - 2026';

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
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    isOpen = true;
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('supportModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
    isOpen = false;
    document.body.style.overflow = '';
}

export function initSupport() {
    createSupportModal();
    const supportBtn = document.getElementById('supportBtn');
    if (supportBtn &&!supportBtn.dataset.bound) {
        supportBtn.dataset.bound = 'true';
        supportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) closeModal();
    });
}

if (typeof document!== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupport);
    } else {
        initSupport();
    }
}

// لا تكشف openModal للعالم - فقط initSupport
if (typeof window!== 'undefined' && location.hostname === 'localhost') {
    window.TarimSupport = { openModal, closeModal };
}
