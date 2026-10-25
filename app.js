/* 
   app.js - سازگار با ساختار قبلی دانشنامه سبزینه
*/

const PAGE_SIZE = 50;
let ALL = [];           // کل داده‌ها
let VIEW = [];          // نتایج فیلتر و جستجو
let page = 0;

const DEFAULT_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='100' viewBox='0 0 150 100'><rect width='100%25' height='100%25' fill='%23e8f5e9'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='15' fill='%232e7d32'>🌿 گیاه دارویی</text></svg>";

// المان‌های صفحه
let els = {};

function initElements() {
  els = {
    grid: document.getElementById('grid') || document.getElementById('list'),
    q: document.getElementById('q') || document.getElementById('searchInput'),
    nature: document.getElementById('nature'),
    category: document.getElementById('category'),
    empty: document.getElementById('empty'),
    count: document.getElementById('count') || document.getElementById('statusBar') || document.getElementById('status')
  };
}

// خواندن اطلاعات ۲۰ هزار گیاه
async function loadData() {
  initElements();

  // اگر داده‌ها قبلاً در متغیرهای سراسری صفحه لود شده باشند
  if (window.herbsData && Array.isArray(window.herbsData)) {
    ALL = window.herbsData;
  } else if (window.ALL && Array.isArray(window.ALL) && window.ALL.length > 0) {
    ALL = window.ALL;
  } else {
    // خواندن مستقیم از فایل جیسون
    const fileNames = ['herbs_20k.json', 'herbs._20k.json', 'herbs_sample.json'];
    for (let f of fileNames) {
      try {
        const res = await fetch(f);
        if (res.ok) {
          ALL = await res.json();
          break;
        }
      } catch (e) {}
    }
  }

  VIEW = ALL;
  updateCount();
  renderGrid(true);
  setupEvents();
}

// به‌روزرسانی متن بالای صفحه
function updateCount() {
  if (els.count) {
    els.count.textContent = `${VIEW.length.toLocaleString('fa-IR')} گیاه فعال`;
  }
}

// نمایش کارتی گیاهان همراه با عکس
function renderGrid(reset = false) {
  if (!els.grid) return;

  if (reset) {
    els.grid.innerHTML = '';
    page = 0;
  }

  const start = page * PAGE_SIZE;
  const items = VIEW.slice(start, start + PAGE_SIZE);

  if (items.length === 0 && start === 0) {
    if (els.empty) els.empty.style.display = 'block';
    return;
  } else if (els.empty) {
    els.empty.style.display = 'none';
  }

  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const name = item.name || item.title || item.farsi || "بدون نام";
    const nature = item.nature || item.temperament || item.tab || "";
    const desc = item.properties || item.desc || item.benefits || item.khavas || "";
    const img = item.image || item.img || DEFAULT_IMG;

    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = "background:#fff; border-radius:10px; border:1px solid #e2e8f0; padding:10px; margin-bottom:10px; cursor:pointer; display:flex; gap:12px; align-items:center; box-shadow:0 1px 3px rgba(0,0,0,0.05);";
    
    card.innerHTML = `
      <img src="${img}" onerror="this.src='${DEFAULT_IMG}'" style="width:75px; height:75px; object-fit:cover; border-radius:8px; background:#f1f5f9; flex-shrink:0;">
      <div style="flex-grow:1; text-align:right;">
        <div style="font-weight:bold; font-size:15px; color:#1b5e20;">${name}</div>
        ${nature ? `<div style="font-size:12px; color:#d97706; margin:3px 0;">طبع: ${nature}</div>` : ''}
        <div style="font-size:12px; color:#64748b; line-height:1.4; max-height:34px; overflow:hidden;">${desc || 'برای توضیحات بیشتر لمس کنید...'}</div>
      </div>
    `;

    // باز کردن صفحه جزئیات با لمس گیاه
    card.onclick = () => openDetailPage(item);
    frag.appendChild(card);
  });

  els.grid.appendChild(frag);
  page++;
}

// موتور جستجوی سریع
function setupEvents() {
  if (els.q) {
    let timer = null;
    els.q.oninput = (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        applyFilters();
      }, 200);
    };
  }

  if (els.nature) {
    els.nature.onchange = () => applyFilters();
  }

  if (els.category) {
    els.category.onchange = () => applyFilters();
  }

  // بارگذاری بیشتر هنگام اسکرول
  window.onscroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
      if ((page * PAGE_SIZE) < VIEW.length) {
        renderGrid(false);
      }
    }
  };
}

function applyFilters() {
  const query = (els.q ? els.q.value.trim().toLowerCase() : "");
  const natureVal = (els.nature ? els.nature.value : "");
  const catVal = (els.category ? els.category.value : "");

  VIEW = ALL.filter(item => {
    const name = (item.name || item.title || item.farsi || "").toLowerCase();
    const nat = (item.nature || item.temperament || item.tab || "").toLowerCase();
    const desc = (item.properties || item.desc || item.benefits || item.khavas || "").toLowerCase();

    const matchQ = !query || name.includes(query) || nat.includes(query) || desc.includes(query);
    const matchNature = !natureVal || nat.includes(natureVal);
    const matchCat = !catVal || (item.category && item.category.includes(catVal));

    return matchQ && matchNature && matchCat;
  });

  updateCount();
  renderGrid(true);
}

// صفحه جزئیات کامل همراه با عکس و دکمه بازگشت
function openDetailPage(item) {
  let modal = document.getElementById('customModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customModal';
    modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:99999; display:flex; justify-content:center; align-items:center; padding:12px;";
    document.body.appendChild(modal);
  }

  const name = item.name || item.title || item.farsi || "نام گیاه";
  const nature = item.nature || item.temperament || item.tab || "نامشخص";
  const desc = item.properties || item.desc || item.benefits || item.khavas || "توضیحاتی ثبت نشده است.";
  const img = item.image || item.img || DEFAULT_IMG;

  modal.innerHTML = `
    <div style="background:#fff; border-radius:12px; width:100%; max-width:500px; max-height:88vh; overflow-y:auto; padding:16px; direction:rtl; text-align:right;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:12px;">
        <h3 style="margin:0; color:#1b5e20; font-size:1.1rem;">${name}</h3>
        <button id="closeBtn" style="background:#2e7d32; color:#fff; border:none; border-radius:6px; padding:6px 14px; font-weight:bold; cursor:pointer;">بازگشت ✕</button>
      </div>
      <img id="detailModalImg" src="${img}" onerror="this.src='${DEFAULT_IMG}'" style="width:100%; height:190px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
      <div style="background:#e8f5e9; color:#1b5e20; display:inline-block; padding:4px 10px; border-radius:6px; font-size:0.8rem; font-weight:bold; margin-bottom:10px;">طبع: ${nature}</div>
      <div style="font-size:13.5px; line-height:1.8; color:#333; margin-bottom:15px;">${desc}</div>
      <div id="wikiDetails" style="background:#f8fafc; border-right:3px solid #2e7d32; padding:10px; font-size:12.5px; line-height:1.6; color:#475569; border-radius:4px;">
        در حال اتصال به دانشنامه برای توضیحات بیشتر...
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById('closeBtn').onclick = () => {
    modal.style.display = 'none';
  };

  // دریافت اطلاعات تکمیلی از دانشنامه آنلاین
  const cleanName = name.split('(')[0].trim();
  fetch(`https://fa.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`)
    .then(r => r.json())
    .then(data => {
      const wEl = document.getElementById('wikiDetails');
      if (wEl && data.extract) {
        wEl.innerHTML = `<strong>اطلاعات تکمیلی دانشنامه:</strong><br>${data.extract}`;
        if (data.thumbnail && data.thumbnail.source && (!item.image && !item.img)) {
          const mImg = document.getElementById('detailModalImg');
          if (mImg) mImg.src = data.thumbnail.source;
        }
      } else if (wEl) {
        wEl.textContent = "توضیحات تکمیلی دیگری برای این گیاه یافت نشد.";
      }
    })
    .catch(() => {
      const wEl = document.getElementById('wikiDetails');
      if (wEl) wEl.textContent = "برای دریافت توضیحات دانشنامه اینترنت را فعال کنید.";
    });
}

// اجرا
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}
