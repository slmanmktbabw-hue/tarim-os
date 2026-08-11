// ==============================================================================
// public/app.js - SOUQ AL MOLOUK V8.7 SECURE - محصن ضد XSS وتلاعب الأسعار
// ==============================================================================
"use strict";

const API = '/api';
let products = [];

function safeParse(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
let cart = safeParse('souq_cart', []);
let token = localStorage.getItem('souq_token');
let user = safeParse('souq_user', null);

const $ = (id) => document.getElementById(id);
const productsGrid = $('products-grid');
const cartCount = $('cart-count');
const cartItems = $('cart-items');
const cartTotal = $('cart-total');

// حماية الـ ID
function isValidId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{4,64}$/.test(id);
}

// ==========================================
// 1. تحميل المنتجات - آمن
// ==========================================
async function loadProducts(filter = {}) {
  try {
    if (productsGrid) productsGrid.textContent = '👑 جاري فتح أبواب القلعة...';
    const params = new URLSearchParams();
    if (filter.category) params.set('category', filter.category);
    if (filter.search) params.set('search', filter.search);
    if (filter.royal) params.set('royal', 'true');
    
    const res = await fetch(`${API}/products?${params.toString()}`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('فشل الاتصال');
    const data = await res.json();
    products = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
    renderProducts(products);
  } catch (err) {
    if (productsGrid) productsGrid.textContent = 'فشل فتح القلعة - حاول مرة أخرى';
  }
}

function renderProducts(list) {
  if (!productsGrid) return;
  productsGrid.innerHTML = '';
  if (!list.length) {
    productsGrid.textContent = 'لا توجد كنوز مطابقة';
    return;
  }
  const frag = document.createDocumentFragment();
  list.forEach(p => {
    if (!isValidId(p._id || p.id)) return;
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imgWrap = document.createElement('div');
    imgWrap.className = 'product-image';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = (p.images && p.images[0]) ? p.images[0] : '/icons/icon-192.png';
    img.alt = '';
    // منع تحميل روابط خارجية مشبوهة
    if (!img.src.startsWith('/') && !img.src.startsWith('https://via.placeholder.com')) {
      img.src = '/icons/icon-192.png';
    }
    imgWrap.appendChild(img);
    if (p.isRoyal) {
      const badge = document.createElement('span');
      badge.className = 'royal-badge';
      badge.textContent = '👑 ملكي';
      card.appendChild(badge);
    }
    const info = document.createElement('div');
    info.className = 'product-info';
    const h3 = document.createElement('h3');
    h3.textContent = (p.title || 'كنز').slice(0, 100); // textContent = آمن ضد XSS
    const desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = (p.description || '').slice(0, 80);
    const priceDiv = document.createElement('div');
    priceDiv.className = 'product-price';
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `${Number(p.price) || 0} ﷼`;
    priceDiv.appendChild(price);

    const actions = document.createElement('div');
    actions.className = 'product-actions';
    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn-add';
    btnAdd.type = 'button';
    btnAdd.textContent = 'أضف للسلة';
    btnAdd.dataset.id = p._id || p.id;
    btnAdd.addEventListener('click', () => addToCart(btnAdd.dataset.id));
    
    const btnView = document.createElement('button');
    btnView.className = 'btn-view';
    btnView.type = 'button';
    btnView.textContent = 'عرض';
    btnView.dataset.id = p._id || p.id;
    btnView.addEventListener('click', () => viewProduct(btnView.dataset.id));

    actions.append(btnAdd, btnView);
    info.append(h3, desc, priceDiv, actions);
    card.append(imgWrap, info);
    frag.appendChild(card);
  });
  productsGrid.appendChild(frag);
}

// ==========================================
// 2. السلة - لا تثق بسعر العميل
// ==========================================
function addToCart(productId) {
  if (!isValidId(productId)) return;
  const product = products.find(p => (p._id === productId || p.id === productId));
  if (!product) return;
  const prodId = product._id || product.id;
  const existing = cart.find(c => c._id === prodId);
  if (existing) existing.qty += 1;
  else cart.push({ _id: prodId, title: product.title.slice(0,100), price: Number(product.price)||0, images: product.images, qty: 1 });
  saveCart(); updateCartUI();
  showToast(`تمت إضافة ${product.title.slice(0,30)} 👑`);
}
function removeFromCart(productId) {
  if (!isValidId(productId)) return;
  cart = cart.filter(c => c._id !== productId);
  saveCart(); updateCartUI();
}
function changeQty(productId, delta) {
  if (!isValidId(productId)) return;
  const item = cart.find(c => c._id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else { saveCart(); updateCartUI(); }
}
function saveCart() {
  try { localStorage.setItem('souq_cart', JSON.stringify(cart.slice(0, 50))); } catch {}
}
function updateCartUI() {
  const totalQty = cart.reduce((s, c) => s + (Number(c.qty)||0), 0);
  const totalPrice = cart.reduce((s, c) => s + ((Number(c.price)||0) * (Number(c.qty)||0)), 0);
  if (cartCount) cartCount.textContent = totalQty;
  if (cartTotal) cartTotal.textContent = totalPrice + ' ﷼';
  if (!cartItems) return;
  cartItems.innerHTML = '';
  if (!cart.length) { cartItems.textContent = 'السلة فارغة'; return; }
  const frag = document.createDocumentFragment();
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    const img = document.createElement('img');
    img.src = (item.images && item.images[0]) || '/icons/icon-192.png';
    img.width = 50; img.alt = '';
    const info = document.createElement('div');
    info.className = 'cart-item-info';
    const h4 = document.createElement('h4');
    h4.textContent = item.title;
    const p = document.createElement('p');
    p.textContent = `${item.price} ﷼ × ${item.qty}`;
    info.append(h4,p);
    const acts = document.createElement('div');
    acts.className = 'cart-item-actions';
    const b1 = document.createElement('button'); b1.type='button'; b1.textContent='-'; b1.addEventListener('click',()=>changeQty(item._id,-1));
    const s = document.createElement('span'); s.textContent=item.qty;
    const b2 = document.createElement('button'); b2.type='button'; b2.textContent='+'; b2.addEventListener('click',()=>changeQty(item._id,1));
    const b3 = document.createElement('button'); b3.type='button'; b3.textContent='🗑️'; b3.addEventListener('click',()=>removeFromCart(item._id));
    acts.append(b1,s,b2,b3);
    row.append(img,info,acts);
    frag.appendChild(row);
  });
  cartItems.appendChild(frag);
}

// ==========================================
// 3. البحث - مع Debounce
// ==========================================
function setupFilters() {
  const searchInput = $('search-input');
  const categorySelect = $('category-filter');
  let t;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => loadProducts({ search: e.target.value.slice(0,50), category: categorySelect?.value }), 400);
  });
  categorySelect?.addEventListener('change', (e) => loadProducts({ category: e.target.value, search: searchInput?.value }));
  document.querySelectorAll('[data-filter-royal]').forEach(btn => btn.addEventListener('click', () => loadProducts({ royal: true })));
}

// ==========================================
// 4. إتمام الطلب - السعر يحسب في السيرفر فقط!
// ==========================================
async function checkout() {
  if (!cart.length) return showToast('السلة فارغة', 'error');
  if (!token) { showToast('سجل دخول أولاً', 'error'); return; }
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'same-origin',
      body: JSON.stringify({
        // نرسل فقط ID والكمية - السعر يحسبه السيرفر من DB
        products: cart.map(c => ({ product: c._id, quantity: Number(c.qty) }))
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'فشل الطلب');
    cart = []; saveCart(); updateCartUI();
    showToast('تم إبرام الطلب - مختوم بالمسك 👑');
  } catch (err) { showToast(err.message, 'error'); }
}

function viewProduct(id) {
  if (!isValidId(id)) return;
  const p = products.find(x => x._id === id || x.id === id);
  if (!p) return;
  showToast(`${p.title} - ${p.price} ﷼`);
}

function showToast(msg, type='success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:25px;right:25px;background:#111;color:#ffd700;padding:12px 22px;border-radius:12px;z-index:9999;border:1px solid rgba(255,215,0,0.3);transform:translateY(120px);transition:transform 0.3s ease;max-width:80vw;word-break:break-word;';
    document.body.appendChild(toast);
  }
  toast.style.background = type === 'error' ? '#8b0000' : '#111';
  toast.textContent = String(msg).slice(0,200);
  toast.style.transform = 'translateY(0)';
  setTimeout(() => toast.style.transform = 'translateY(120px)', 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts(); updateCartUI(); setupFilters();
  $('checkout-btn')?.addEventListener('click', checkout);
  $('clear-cart')?.addEventListener('click', () => { cart=[]; saveCart(); updateCartUI(); showToast('تم إفراغ السلة'); });
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty = changeQty;
