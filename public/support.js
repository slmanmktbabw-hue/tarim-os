// public/support.js - TARIM OS V8.6 KING EDITION - ESM SHIELD - NO ALERT
"use strict";

let isOpen = false;

function createSupportModal() {
    if (document.getElementById('supportModal')) return;

    const modal = document.createElement('div');
    modal.id = 'supportModal';
    modal.className = 'hidden fixed inset-0 z-[10002] bg-black/90 backdrop-blur-sm p-4 items-center justify-center';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.display = 'none';

    const box = document.createElement('div');
    box.className = 'glass w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl border border-cyan-500/20';
    box.style.cssText += ';background:rgba(10,20,40,.96);backdrop-filter:blur(14px);border:1px solid rgba(0,240,255,.15);border-radius:24px;padding:24px';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:16px;margin-bottom:16px';
    const title = document.createElement('h3');
    title.style.cssText = 'font-size:13px;font-weight:900;color:#22d3ee';
    title.textContent = '🛡️ فريق الدعم السيادي V8.6 KING';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'closeSupportBtn';
    closeBtn.style.cssText = 'color:#94a3b8;background:#0f172a;padding:6px 12px;border-radius:10px;font-size:12px;border:1px solid rgba(255,255,255,.08);cursor:pointer';
    closeBtn.textContent = 'إغلاق ✕';
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex-direction:column;gap:16px;text-align:right';

    const info = document.createElement('div');
    info.style.cssText = 'background:rgba(15,23,42,.7);padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;gap:8px';
    const p1 = document.createElement('p');
    p1.style.cssText = 'font-size:13px;color:#e2e8f0';
    p1.textContent = 'أهلاً بك يا إمبراطور AL في مركز القيادة من تريم حضرموت V8.6 KING EDITION.';
    const p2 = document.createElement('p');
    p2.style.cssText = 'font-size:11px;color:#94a3b8;line-height:1.8';
    p2.textContent = 'نعمل 24/7 لحماية سيادة منصتك. ESM Shield • bcrypt 12 • JWT • متوسط الرد 8 دقائق. tarimos.org';
    info.append(p1, p2);

    const actions = document.createElement('div');
    actions.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px';

    const waBtn = document.createElement('a');
    waBtn.href = 'https://wa.me/967000000000?text=سلام%20فريق%20TARIM%20OS%20V8.6%20KING';
    waBtn.target = '_blank'; 
    waBtn.rel = 'noopener';
    waBtn.style.cssText = 'background:#059669;color:#fff;text-align:center;padding:12px;border-radius:12px;font-size:12px;font-weight:700;display:block';
    waBtn.textContent = '💬 واتساب سيادي';

    const mailBtn = document.createElement('a');
    mailBtn.href = 'mailto:sovereign@tarimos.org?subject=دعم%20TARIM%20OS%20V8.6%20KING';
    mailBtn.style.cssText = 'background:#0f172a;color:#fff;text-align:center;padding:12px;border-radius:12px;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,.1);display:block';
    mailBtn.textContent = '✉️ بريد سيادي';

    actions.append(waBtn, mailBtn);

    const footer = document.createElement('p');
    footer.style.cssText = 'font-size:10px;color:#64748b;text-align:center;margin-top:8px';
    footer.textContent = 'Tarim, Hadhramaut 16.05,48.98 • V8.6 KING EDITION • ESM Shield • من تريم إلى العالم - 2026';

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
    const supportBtn = document.getElementById('supportBtn') || document.getElementById('openSupportBtn');
    if (supportBtn && !supportBtn.dataset.bound) {
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

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupport);
    } else {
        initSupport();
    }
}

if (typeof window !== 'undefined') {
    window.TarimSupport = { openModal, closeModal, initSupport };
}
