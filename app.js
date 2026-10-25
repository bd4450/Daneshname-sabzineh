/* 
   app.js - موتور جستجو و نمایش گیاهان دارویی
*/

const PAGE_SIZE = 50;
let ALL = [];           // کل داده‌ها
let VIEW = [];          // نتایج فیلتر و جستجو
let FAVS = new Set();   // لیست علاقه‌مندی‌ها
let page = 0;
let lastQuery = { q: "", nature: "", category: "", favOnly: false };

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
  // تاخیر ۳۰۰ میلی‌ثانیه برای جستجوی روان در گوشی
  const debounced = debounce(() => applyFilter(true), 300);
  
  if (els.q) els.q.addEventListener('input', debounced);
  if (els.nature) els.nature.addEventListener('change', () => applyFilter(true));
  if (els.category) els.category.addEventListener('change', () => applyFilter(true));
  
  if (els.clearBtn) {
    els.clearBtn.addEventListener('click', () => { 
      els.q.value = ""; 
      applyFilter(true); 
    });
  }

  if (els.reload) {
    els.reload.addEventListener('click', () => { 
      resetFilters(); 
      applyFilter(true); 
    });
  }

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
    if (!it) return false;
    if (nature && String(it.nat) !== nature) return false;
    if (category && it.cat !== category) return false;
    if (lastQuery.favOnly && !FAVS.has(it.id)) return false;
    if (!q) return true;

    // جستجوی ایمن و بدون کرش
    const faText = normalize(it.fa || "");
    const sciText = normalize(it.sci || "");
    
    if (faText.includes(q) || sciText.includes(q)) return true;

    if (Array.isArray(it.prop)) {
      for (let i = 0; i < it.prop.length; i++) {
        if (normalize(it.prop[i]).includes(q)) return true;
      }
    }

    if (Array.isArray(it.ind)) {
      for (let i = 0; i < it.ind.length; i++) {
        if (normalize(it.ind[i]).includes(q)) return true;
      }
    }

    return false;
  });

  if (reset) {
    if (els.grid) els.grid.innerHTML = "";
    page = 0;
  }
  
  if (els.count) els.count.textContent = Math.min((page + 1) * PAGE_SIZE, VIEW.length).toString();
  if (els.total) els.total.textContent = ALL.length.toString();

  renderPage();
  toggleEmpty();
}

function renderPage() {
  if (!els.grid) return;
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, VIEW.length);
  const slice = VIEW.slice(start, end);
  const frag = document.createDocumentFragment();
  
  for (const it of slice) {
    frag.appendChild(card(it));
  }
  els.grid.appendChild(frag);
}

function getHerbImage(it) {
  if (it.img) return it.img;
  if (it.image) return it.image;
  const query = it.sci || it.fa || '';
  return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query + ' medicinal herb')}&w=300&c=7&rs=1&p=0`;
}

function card(it) {
  const div = document.createElement('div');
  div.className = 'card';
  div.style.cursor = 'pointer';

  const imgUrl = getHerbImage(it);

  div.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center;">
      <img src="${imgUrl}" 
           alt="${escapeHtml(it.fa)}" 
           loading="lazy" 
           onerror="this.onerror=null; this.src='${DEFAULT_HERB_IMG}';" 
           style="width:70px; height:70px; object-fit:cover; border-radius:8px; background:#f0f7f0; flex-shrink:0;">
      <div style="flex-grow:1; min-width:0;">
        <h3 style="margin:0 0 4px; font-size:1.15rem; color:#1b5e20;">${escapeHtml(it.fa)}</h3>
        <div class="sci" style="color:#777; font-size:0.85rem; font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(it.sci || '')}</div>
      </div>
    </div>

    <div class="chips" style="margin-top:10px;">
      ${chip(natureLabel(it.nat))}
      ${it.cat ? chip(it.cat) : ''}
      ${(it.prop || []).slice(0, 3).map(chip).join('')}
    </div>

    ${it.ind && it.ind.length ? `<div class="muted" style="margin-top:8px; font-size:0.85rem;"><b>کاربرد:</b> ${escapeHtml(it.ind.slice(0, 4).join('، '))}</div>` : ''}

    <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #eee; padding-top:8px;">
      <button class="fav ${FAVS.has(it.id) ? 'active' : ''}" data-id="${it.id}">
        ${FAVS.has(it.id) ? '★ حذف' : '☆ علاقه‌مندی'}
      </button>
      <span style="font-size:0.85rem; color:#2e7d32; font-weight:bold;">مشاهده جزئیات کامل ➔</span>
    </div>
  `;

  div.addEventListener('click', (e) => {
    if (e.target.closest('.fav')) return;
    showDetail(it);
  });

  const favBtn = div.querySelector('.fav');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFav(it.id, favBtn);
  });

  return div;
}

function setupDetailView() {
  if (document.getElementById('herb-detail-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'herb-detail-modal';
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #ffffff;
    z-index: 99999;
    overflow-y: auto;
    direction: rtl;
    padding-bottom: 50px;
  `;

  modal.innerHTML = `
    <div style="position:sticky; top:0; background:#2e7d32; color:#fff; padding:12px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15); z-index:10;">
      <button id="modal-back-btn" style="background:rgba(255,255,255,0.2); border:none; color:#fff; font-size:1.1rem; border-radius:6px; padding:6px 14px; cursor:pointer;">➔ بازگشت</button>
      <h3 id="modal-title" style="margin:0; font-size:1.1rem; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">جزئیات گیاه</h3>
    </div>
    <div id="modal-body" style="padding:16px; max-width:680px; margin:0 auto; line-height:1.8;"></div>
  `;

  document.body.appendChild(modal);

  document.getElementById('modal-back-btn').addEventListener('click', closeDetail);

  window.addEventListener('popstate', () => {
    if (modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });
}

function showDetail(it) {
  const modal = document.getElementById('herb-detail-modal');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');

  title.textContent = it.fa || 'شناسنامه گیاه';
  const imgUrl = getHerbImage(it);

  // بررسی وجود فیلدهای متن در دیتا
  const extraDesc = it.desc || it.description || it.text || it.info || '';

  body.innerHTML = `
    <div style="text-align:center; margin-bottom:16px;">
      <img src="${imgUrl}" 
           alt="${escapeHtml(it.fa)}"
           onerror="this.onerror=null; this.src='${DEFAULT_HERB_IMG}';"
           style="width:100%; max-height:240px; object-fit:cover; border-radius:12px; background:#f4f9f4; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <h2 style="margin:14px 0 2px; color:#1b5e20;">${escapeHtml(it.fa)}</h2>
      <div style="color:#666; font-size:0.95rem; font-style:italic;">${escapeHtml(it.sci || '')}</div>
    </div>

    <div style="background:#f1f8e9; border-radius:10px; padding:12px 16px; margin-bottom:16px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div><b>طبع:</b> ${natureLabel(it.nat) || 'نامشخص'}</div>
      <div><b>دسته‌بندی:</b> ${escapeHtml(it.cat || 'عمومی')}</div>
    </div>

    ${it.prop && it.prop.length ? `
      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px; color:#2e7d32;">خواص و فواید درمانی:</h4>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${it.prop.map(p => `<span style="background:#e8f5e9; color:#2e7d32; padding:4px 10px; border-radius:12px; font-size:0.9rem;">${escapeHtml(p)}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    ${it.ind && it.ind.length ? `
      <div style="margin-bottom:16px; background:#fafafa; padding:12px; border-radius:8px; border:1px solid #eee;">
        <h4 style="margin:0 0 6px; color:#2e7d32;">موارد مصرف و اندیکاسیون‌ها:</h4>
        <div style="color:#444;">${escapeHtml(it.ind.join(' ، '))}</div>
      </div>
    ` : ''}

    ${it.warn ? `
      <div style="background:#ffebee; border-right:4px solid #d32f2f; padding:10px 14px; border-radius:6px; margin-bottom:16px;">
        <b style="color:#d32f2f;">احتیاط، منع مصرف و عوارض:</b>
        <div style="margin-top:4px; color:#444;">${escapeHtml(it.warn)}</div>
      </div>
    ` : ''}

    ${extraDesc ? `
      <div style="margin-bottom:20px;">
        <h4 style="margin:0 0 8px; color:#2e7d32;">توضیحات تکمیلی گیاه:</h4>
        <div style="color:#333; line-height:1.9;">${escapeHtml(extraDesc)}</div>
      </div>
    ` : ''}

    <!-- دریافت آنلاین دانشنامه از ویکی‌پدیا در صورت نیاز -->
    <div style="margin-top:20px; padding:14px; background:#eef6ff; border-radius:10px; border:1px solid #cce3ff;">
      <div style="font-weight:bold; color:#0d47a1; margin-bottom:6px;">دانشنامه تکمیلی آنلاین:</div>
      <div id="wiki-content" style="font-size:0.9rem; color:#444;">
        برای خواندن مقاله کامل و تاریخچه گیاه‌شناسی کلیک کنید:
      </div>
      <button id="fetch-wiki-btn" style="margin-top:10px; background:#1976d2; color:#fff; border:none; border-radius:6px; padding:8px 14px; cursor:pointer; font-size:0.9rem;">
        دریافت دانشنامه تکمیلی گیاه
      </button>
    </div>

    <button id="modal-bottom-back-btn" style="width:100%; padding:12px; background:#2e7d32; color:#fff; border:none; border-radius:8px; font-size:1rem; cursor:pointer; margin-top:24px;">
      بازگشت به فهرست
    </button>
  `;

  document.getElementById('modal-bottom-back-btn').addEventListener('click', closeDetail);

  // جستجوی خودکار در دانشنامه با زدن دکمه
  const wikiBtn = document.getElementById('fetch-wiki-btn');
  wikiBtn.addEventListener('click', () => {
    fetchWiki(it.fa || it.sci);
  });

  modal.style.display = 'block';
  modal.scrollTop = 0;
  history.pushState({ modalOpen: true }, '');
}

async function fetchWiki(title) {
  const wikiBox = document.getElementById('wiki-content');
  const wikiBtn = document.getElementById('fetch-wiki-btn');
  wikiBox.innerHTML = 'در حال جستجو و دریافت اطلاعات دانشنامه...';
  wikiBtn.style.display = 'none';

  try {
    const cleanTitle = title.split('(')[0].trim();
    const url = `https://fa.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('یافت نشد');
    const data = await res.json();
    
    if (data.extract) {
      wikiBox.innerHTML = `
        <div style="line-height:1.9; color:#222;">${escapeHtml(data.extract)}</div>
        <div style="margin-top:8px;">
          <a href="https://fa.wikipedia.org/wiki/${encodeURIComponent(cleanTitle)}" target="_blank" style="color:#1976d2; text-decoration:none; font-weight:bold;">
            مشاهده مقاله کامل در ویکی‌پدیا ↗
          </a>
        </div>
      `;
    } else {
      wikiBox.innerHTML = 'توضیحات تکمیلی آنلاین برای این گیاه یافت نشد.';
    }
  } catch (e) {
    wikiBox.innerHTML = 'اطلاعات بیشتری در وب پیدا نشد یا اینترنت متصل نیست.';
  }
}

function closeDetail() {
  const modal = document.getElementById('herb-detail-modal');
  if (modal && modal.style.display === 'block') {
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
    .toString()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[‌\s]+/g, ' ')
    .trim();
}

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>"']/g, c => ({
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
