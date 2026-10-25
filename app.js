/* 
   app.js - موتور جستجو و نمایش گیاهان دارویی
*/

const PAGE_SIZE = 50;
let ALL = [];           // کل داده‌ها
let VIEW = [];          // نتایج فیلتر و جستجو
let FAVS = new Set();   // لیست علاقه‌مندی‌ها
let page = 0;
let lastQuery = { q: "", nature: "", category: "", favOnly: false };

// تصویر پیش‌فرض گیاهی (آیکون وکتور سبک برای مواقع آفلاین)
const DEFAULT_HERB_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%232e7d32' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z'/><path d='M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'/></svg>";

const els = {
  grid: document.getElementById('grid'),
  empty: document.getElementById('empty'),
  q: document.getElementById('q'),
  nature: document.getElementById('nature'),
  category: document.getElementById('category'),
  favToggle: document.getElementById('favToggle'),
  clearBtn: document.getElementById('clearBtn'),
  reload: document.getElementById('reload'),
  count: document.getElementById('count'),
  total: document.getElementById('total'),
};

init();

async function init() {
  loadFavs();
  setupDetailView();
  await loadData();
  if (els.total) els.total.textContent = ALL.length.toString();
  bindEvents();
  applyFilter(true);
  observeScroll();
}

function bindEvents() {
  const debounced = debounce(applyFilter, 200);
  if (els.q) els.q.addEventListener('input', debounced);
  if (els.nature) els.nature.addEventListener('change', () => applyFilter(true));
  if (els.category) els.category.addEventListener('change', () => applyFilter(true));
  if (els.clearBtn) els.clearBtn.addEventListener('click', () => { els.q.value = ""; applyFilter(true); });
  if (els.reload) els.reload.addEventListener('click', () => { resetFilters(); applyFilter(true); });
  if (els.favToggle) {
    els.favToggle.addEventListener('click', () => {
      lastQuery.favOnly = !lastQuery.favOnly;
      els.favToggle.classList.toggle('accent', lastQuery.favOnly);
      els.favToggle.textContent = lastQuery.favOnly ? "نمایش همه" : "فقط علاقه‌مندی‌ها";
      applyFilter(true);
    });
  }
}

function resetFilters() {
  if (els.q) els.q.value = "";
  if (els.nature) els.nature.value = "";
  if (els.category) els.category.value = "";
  lastQuery.favOnly = false;
  if (els.favToggle) {
    els.favToggle.classList.remove('accent');
    els.favToggle.textContent = "فقط علاقه‌مندی‌ها";
  }
}

async function loadData() {
  try {
    const res = await fetch('herbs_20k.json');
    ALL = await res.json();
  } catch (e) {
    console.error('خطا در خواندن فایل دیتا:', e);
    ALL = [];
  }
}

function applyFilter(reset = false) {
  const q = normalize(els.q ? els.q.value : "");
  const nature = els.nature ? els.nature.value : "";
  const category = els.category ? els.category.value : "";
  lastQuery = { q, nature, category, favOnly: lastQuery.favOnly };

  VIEW = ALL.filter(it => {
    if (nature && String(it.nat) !== nature) return false;
    if (category && it.cat !== category) return false;
    if (lastQuery.favOnly && !FAVS.has(it.id)) return false;
    if (!q) return true;
    
    const hay = [
      it.fa || "", 
      it.sci || "",
      ...(it.prop || []), 
      ...(it.ind || [])
    ].join(' | ');
    
    return normalize(hay).includes(q);
  });

  if (reset) {
    els.grid.innerHTML = "";
    page = 0;
  }
  if (els.count) els.count.textContent = Math.min((page + 1) * PAGE_SIZE, VIEW.length).toString();
  if (els.total) els.total.textContent = ALL.length.toString();

  renderPage();
  toggleEmpty();
}

function renderPage() {
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, VIEW.length);
  const slice = VIEW.slice(start, end);
  const frag = document.createDocumentFragment();
  for (const it of slice) {
    frag.appendChild(card(it));
  }
  els.grid.appendChild(frag);
}

// ساخت کارت هر گیاه
function card(it) {
  const div = document.createElement('div');
  div.className = 'card';
  div.style.cursor = 'pointer';

  // انتخاب آدرس عکس
  const imgUrl = it.img || it.image || `https://tse2.mm.bing.net/th?q=${encodeURIComponent((it.sci || it.fa) + ' plant')}&w=300&c=7&rs=1&p=0`;

  div.innerHTML = `
    <div style="display:flex; gap:12px; align-items:flex-start;">
      <img src="${imgUrl}" 
           alt="${escapeHtml(it.fa)}" 
           loading="lazy" 
           onerror="this.onerror=null; this.src='${DEFAULT_HERB_IMG}';" 
           style="width:75px; height:75px; object-fit:cover; border-radius:8px; background:#f1f8e9; flex-shrink:0;">
      <div style="flex-grow:1;">
        <h3 style="margin:0; font-size:1.15rem; color:#1b5e20;">${escapeHtml(it.fa)}</h3>
        <div class="sci" style="color:#666; font-size:0.85rem; font-style:italic;">${escapeHtml(it.sci || '')}</div>
      </div>
    </div>

    <div class="chips" style="margin-top:8px;">
      ${chip(natureLabel(it.nat))}
      ${it.cat ? chip(it.cat) : ''}
      ${(it.prop || []).slice(0, 3).map(chip).join('')}
    </div>

    ${it.ind && it.ind.length ? `<div class="muted" style="margin-top:6px; font-size:0.85rem;"><b>کاربرد:</b> ${escapeHtml(it.ind.slice(0, 4).join('، '))}</div>` : ''}
    ${it.warn ? `<div class="warn" style="font-size:0.8rem; margin-top:4px;"><b>هشدار:</b> ${escapeHtml(it.warn)}</div>` : ''}

    <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
      <button class="fav ${FAVS.has(it.id) ? 'active' : ''}" data-id="${it.id}">
        ${FAVS.has(it.id) ? '★ حذف' : '☆ علاقه‌مندی'}
      </button>
      <span style="font-size:0.8rem; color:#2e7d32; font-weight:bold;">مشاهده جزئیات ←</span>
    </div>
  `;

  // باز شدن صفحه جزئیات با زدن روی کارت
  div.addEventListener('click', (e) => {
    if (e.target.closest('.fav')) return; // جلوگیری از باز شدن هنگام زدن دکمه ستاره
    showDetail(it);
  });

  const favBtn = div.querySelector('.fav');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFav(it.id, favBtn);
  });

  return div;
}

// ساخت ساختار مدال تمام‌صفحه جزئیات به صورت داینامیک
function setupDetailView() {
  if (document.getElementById('herb-detail-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'herb-detail-modal';
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #fff;
    z-index: 99999;
    overflow-y: auto;
    direction: rtl;
    font-family: inherit;
    padding-bottom: 40px;
  `;

  modal.innerHTML = `
    <div style="position:sticky; top:0; background:#2e7d32; color:#fff; padding:14px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
      <button id="modal-back-btn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer; padding:0 6px;">✕</button>
      <h2 id="modal-title" style="margin:0; font-size:1.2rem; font-weight:bold;">جزئیات گیاه</h2>
    </div>
    <div id="modal-body" style="padding:16px; max-width:650px; margin:0 auto; line-height:1.7;">
      <!-- محتوا اینجا قرار می‌گیرد -->
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('modal-back-btn').addEventListener('click', closeDetail);

  // هماهنگی با کلید بازگشت (Back) گوشی
  window.addEventListener('popstate', () => {
    modal.style.display = 'none';
  });
}

function showDetail(it) {
  const modal = document.getElementById('herb-detail-modal');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');

  title.textContent = it.fa || 'اطلاعات گیاه';
  const imgUrl = it.img || it.image || `https://tse2.mm.bing.net/th?q=${encodeURIComponent((it.sci || it.fa) + ' plant')}&w=600&c=7&rs=1&p=0`;

  body.innerHTML = `
    <div style="text-align:center; margin-bottom:16px;">
      <img src="${imgUrl}" 
           alt="${escapeHtml(it.fa)}"
           onerror="this.onerror=null; this.src='${DEFAULT_HERB_IMG}';"
           style="width:100%; max-height:260px; object-fit:cover; border-radius:12px; background:#f9f9f9; box-shadow:0 3px 10px rgba(0,0,0,0.08);">
      <h1 style="margin:12px 0 4px; color:#1b5e20; font-size:1.6rem;">${escapeHtml(it.fa)}</h1>
      <div style="color:#666; font-size:1rem; font-style:italic;">${escapeHtml(it.sci || '')}</div>
    </div>

    <div style="background:#f4f9f4; border-radius:10px; padding:12px 14px; margin-bottom:16px;">
      <div><b>طبع و مزاج:</b> ${natureLabel(it.nat) || 'نامشخص'}</div>
      ${it.cat ? `<div style="margin-top:6px;"><b>دسته‌بندی:</b> ${escapeHtml(it.cat)}</div>` : ''}
    </div>

    ${it.prop && it.prop.length ? `
      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px; color:#2e7d32;">خواص درمانی:</h4>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${it.prop.map(p => `<span class="chip" style="background:#e8f5e9; padding:4px 10px; border-radius:14px; font-size:0.9rem;">${escapeHtml(p)}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    ${it.ind && it.ind.length ? `
      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px; color:#2e7d32;">مفید برای بیماری‌ها و مشکلات:</h4>
        <div style="color:#333;">${escapeHtml(it.ind.join(' ، '))}</div>
      </div>
    ` : ''}

    ${it.warn ? `
      <div style="background:#ffebee; border-right:4px solid #d32f2f; padding:10px 14px; border-radius:6px; margin-bottom:16px;">
        <b style="color:#d32f2f;">احتیاط و هشدارها:</b>
        <div style="margin-top:4px; color:#555;">${escapeHtml(it.warn)}</div>
      </div>
    ` : ''}

    ${it.desc ? `
      <div style="margin-bottom:20px;">
        <h4 style="margin:0 0 8px; color:#2e7d32;">توضیحات تکمیلی:</h4>
        <div style="color:#444; line-height:1.8;">${escapeHtml(it.desc)}</div>
      </div>
    ` : ''}

    <button id="modal-bottom-back-btn" style="width:100%; padding:12px; background:#2e7d32; color:#fff; border:none; border-radius:8px; font-size:1rem; cursor:pointer; margin-top:20px;">
      بازگشت به فهرست گیاهان
    </button>
  `;

  document.getElementById('modal-bottom-back-btn').addEventListener('click', closeDetail);

  modal.style.display = 'block';
  modal.scrollTop = 0;
  history.pushState({ modalOpen: true }, '');
}

function closeDetail() {
  const modal = document.getElementById('herb-detail-modal');
  if (modal.style.display === 'block') {
    modal.style.display = 'none';
    if (history.state && history.state.modalOpen) {
      history.back();
    }
  }
}

function toggleFav(id, btn) {
  if (FAVS.has(id)) {
    FAVS.delete(id);
  } else {
    FAVS.add(id);
  }
  btn.classList.toggle('active');
  btn.textContent = FAVS.has(id) ? '★ حذف' : '☆ علاقه‌مندی';
  saveFavs();
  if (lastQuery.favOnly) applyFilter(true);
}

function chip(text) {
  if (!text) return '';
  return `<span class="chip">${escapeHtml(text)}</span>`;
}

function natureLabel(n) {
  switch (Number(n)) {
    case 1: return 'گرم و خشک';
    case 2: return 'سرد و خشک';
    case 3: return 'گرم و تر';
    case 4: return 'معتدل';
    default: return '';
  }
}

function toggleEmpty() {
  if (els.empty) els.empty.style.display = VIEW.length ? 'none' : 'block';
}

function observeScroll() {
  window.addEventListener('scroll', onScroll, { passive: true });
}

function onScroll() {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
  if (nearBottom) {
    const nextStart = (page + 1) * PAGE_SIZE;
    if (nextStart < VIEW.length) {
      page++;
      if (els.count) els.count.textContent = Math.min((page + 1) * PAGE_SIZE, VIEW.length).toString();
      renderPage();
    }
  }
}

function loadFavs() {
  try {
    const raw = localStorage.getItem('herb_favs') || '[]';
    FAVS = new Set(JSON.parse(raw));
  } catch {
    FAVS = new Set();
  }
}

function saveFavs() {
  localStorage.setItem('herb_favs', JSON.stringify([...FAVS]));
}

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[‌\s]+/g, ' ')
    .trim();
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}
