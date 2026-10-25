/* 
   app.js - موتور جستجو و نمایش گیاهان دارویی
*/

const PAGE_SIZE = 50;
let ALL = [];           // کل داده‌ها
let VIEW = [];          // نتایج فیلتر و جستجو
let FAVS = new Set();   // لیست علاقه‌مندی‌ها
let page = 0;
let lastQuery = { q: "", nature: "", category: "", favOnly: false };

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
  await loadData();
  els.total.textContent = ALL.length.toString();
  bindEvents();
  applyFilter(true);
  observeScroll();
}

function bindEvents() {
  const debounced = debounce(applyFilter, 200);
  els.q.addEventListener('input', debounced);
  els.nature.addEventListener('change', () => applyFilter(true));
  els.category.addEventListener('change', () => applyFilter(true));
  els.clearBtn.addEventListener('click', () => { els.q.value = ""; applyFilter(true); });
  els.reload.addEventListener('click', () => { resetFilters(); applyFilter(true); });
  els.favToggle.addEventListener('click', () => {
    lastQuery.favOnly = !lastQuery.favOnly;
    els.favToggle.classList.toggle('accent', lastQuery.favOnly);
    els.favToggle.textContent = lastQuery.favOnly ? "نمایش همه" : "فقط علاقه‌مندی‌ها";
    applyFilter(true);
  });
}

function resetFilters() {
  els.q.value = "";
  els.nature.value = "";
  els.category.value = "";
  lastQuery.favOnly = false;
  els.favToggle.classList.remove('accent');
  els.favToggle.textContent = "فقط علاقه‌مندی‌ها";
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
  const q = normalize(els.q.value);
  const nature = els.nature.value;
  const category = els.category.value;
  lastQuery = { q, nature, category, favOnly: lastQuery.favOnly };

  VIEW = ALL.filter(it => {
    if (nature && String(it.nat) !== nature) return false;
    if (category && it.cat !== category) return false;
    if (lastQuery.favOnly && !FAVS.has(it.id)) return false;
    if (!q) return true;
    
    // جستجو در نام فارسی، لاتین، خواص و کاربردها
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
  els.count.textContent = Math.min((page + 1) * PAGE_SIZE, VIEW.length).toString();
  els.total.textContent = ALL.length.toString();

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

function card(it) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <h3>${escapeHtml(it.fa)}</h3>
    <div class="sci">${escapeHtml(it.sci || '')}</div>
    <div class="chips">
      ${chip(natureLabel(it.nat))}
      ${it.cat ? chip(it.cat) : ''}
      ${(it.prop || []).slice(0, 3).map(chip).join('')}
    </div>
    ${it.ind && it.ind.length ? `<div class="muted" style="margin-top:6px;"><b>کاربرد برای:</b> ${escapeHtml(it.ind.join('، '))}</div>` : ''}
    ${it.warn ? `<div class="warn"><b>هشدار:</b> ${escapeHtml(it.warn)}</div>` : ''}
    <div style="margin-top:10px;">
      <button class="fav ${FAVS.has(it.id) ? 'active' : ''}" data-id="${it.id}">
        ${FAVS.has(it.id) ? '★ حذف از علاقه‌مندی' : '☆ نشان کردن'}
      </button>
    </div>
  `;
  const favBtn = div.querySelector('.fav');
  favBtn.addEventListener('click', () => toggleFav(it.id, favBtn));
  return div;
}

function toggleFav(id, btn) {
  if (FAVS.has(id)) {
    FAVS.delete(id);
  } else {
    FAVS.add(id);
  }
  btn.classList.toggle('active');
  btn.textContent = FAVS.has(id) ? '★ حذف از علاقه‌مندی' : '☆ نشان کردن';
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
  els.empty.style.display = VIEW.length ? 'none' : 'block';
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
      els.count.textContent = Math.min((page + 1) * PAGE_SIZE, VIEW.length).toString();
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
