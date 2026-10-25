/* 
   app.js - نسخه سازگار و بدون خطا برای موبایل
*/

const PAGE_SIZE = 40;
let ALL_DATA = [];
let FILTERED_DATA = [];
let renderedCount = 0;

const DEFAULT_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='100' viewBox='0 0 150 100'><rect width='100%25' height='100%25' fill='%23e8f5e9'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%232e7d32'>🌿 گیاه</text></svg>";

function getEl(id) {
  return document.getElementById(id);
}

// لود سریع و امن داده‌ها
async function loadData() {
  const statusEl = getEl('statusBar') || getEl('status') || getEl('count') || document.querySelector('.status');
  
  // ۱. بررسی متغیرهای جهانی قدیمی در صورت وجود
  if (window.herbsData && Array.isArray(window.herbsData)) {
    ALL_DATA = window.herbsData;
    setupApp();
    return;
  }

  // ۲. تلاش برای خواندن فایل جیسون
  try {
    if (statusEl) statusEl.textContent = "در حال بارگذاری داده‌ها...";
    const res = await fetch('herbs_20k.json');
    if (!res.ok) throw new Error("فایل herbs_20k.json پیدا نشد (کد: " + res.status + ")");
    ALL_DATA = await res.json();
    setupApp();
  } catch (err) {
    // اگر فایل با نام دیگر بود امتحان کن
    try {
      const res2 = await fetch('herbs._20k.json');
      if (res2.ok) {
        ALL_DATA = await res2.json();
        setupApp();
        return;
      }
    } catch(e) {}

    const grid = getEl('grid') || document.querySelector('.grid') || document.body;
    grid.innerHTML = `
      <div style="background:#ffebee; color:#c62828; padding:15px; border-radius:10px; margin:15px; line-height:1.8; text-align:right;">
        <strong>⚠️ خطا در خواندن اطلاعات:</strong><br>
        مرورگر اجازه خواندن مستقیم فایل json را نداد یا فایل پیدا نشد.<br>
        <small style="color:#555;">پیام خطا: ${err.message}</small>
      </div>
    `;
  }
}

function setupApp() {
  FILTERED_DATA = ALL_DATA;
  const statusEl = getEl('statusBar') || getEl('status') || getEl('count');
  if (statusEl) {
    statusEl.textContent = `تعداد گیاهان: ${ALL_DATA.length.toLocaleString('fa-IR')} مورد`;
  }
  renderList(true);
  bindEvents();
}

function renderList(reset = false) {
  const grid = getEl('grid') || document.querySelector('.grid') || document.getElementById('list');
  if (!grid) return;

  if (reset) {
    grid.innerHTML = '';
    renderedCount = 0;
  }

  const items = FILTERED_DATA.slice(renderedCount, renderedCount + PAGE_SIZE);
  if (items.length === 0 && renderedCount === 0) {
    grid.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">موردی یافت نشد.</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const name = item.name || item.title || item.farsi || "بدون نام";
    const nature = item.nature || item.temperament || item.tab || "";
    const desc = item.properties || item.desc || item.benefits || item.khavas || "";
    const img = item.image || item.img || DEFAULT_IMG;

    const card = document.createElement('div');
    card.style.cssText = "background:#fff; border-radius:10px; border:1px solid #e0e0e0; overflow:hidden; padding:8px; margin-bottom:10px; cursor:pointer; display:flex; gap:10px; align-items:center;";
    card.innerHTML = `
      <img src="${img}" onerror="this.src='${DEFAULT_IMG}'" style="width:70px; height:70px; object-fit:cover; border-radius:8px; background:#f0f0f0; flex-shrink:0;">
      <div style="flex-grow:1; text-align:right;">
        <div style="font-weight:bold; font-size:15px; color:#1b5e20;">${name}</div>
        ${nature ? `<div style="font-size:12px; color:#e65100; margin:2px 0;">طبع: ${nature}</div>` : ''}
        <div style="font-size:12px; color:#666; max-height:36px; overflow:hidden; line-height:1.4;">${desc}</div>
      </div>
    `;
    card.onclick = () => showModal(item);
    frag.appendChild(card);
  });

  grid.appendChild(frag);
  renderedCount += items.length;
}

function bindEvents() {
  // پیدا کردن کادر جستجو با هر نامی که باشد
  const searchInput = getEl('q') || getEl('searchInput') || getEl('search') || document.querySelector('input[type="text"]') || document.querySelector('input[type="search"]');
  
  if (searchInput) {
    searchInput.oninput = (e) => {
      const val = e.target.value.trim().toLowerCase();
      if (!val) {
        FILTERED_DATA = ALL_DATA;
      } else {
        FILTERED_DATA = ALL_DATA.filter(it => {
          const n = (it.name || it.title || it.farsi || "").toLowerCase();
          const t = (it.nature || it.temperament || it.tab || "").toLowerCase();
          const d = (it.properties || it.desc || it.benefits || it.khavas || "").toLowerCase();
          return n.includes(val) || t.includes(val) || d.includes(val);
        });
      }
      renderList(true);
    };
  }

  // اضافه کردن رویداد اسکرول برای بارگذاری خودکار بقیه ۲۰ هزار گیاه
  window.onscroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) {
      if (renderedCount < FILTERED_DATA.length) {
        renderList(false);
      }
    }
  };
}

// مودال جزئیات و دکمه بازگشت
function showModal(item) {
  let modal = getEl('customDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customDetailModal';
    modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:99999; display:flex; justify-content:center; align-items:center; padding:15px;";
    document.body.appendChild(modal);
  }

  const name = item.name || item.title || item.farsi || "گیاه";
  const nature = item.nature || item.temperament || item.tab || "نامشخص";
  const desc = item.properties || item.desc || item.benefits || item.khavas || "توضیحی ثبت نشده است.";
  const img = item.image || item.img || DEFAULT_IMG;

  modal.innerHTML = `
    <div style="background:#fff; border-radius:14px; width:100%; max-width:480px; max-height:85vh; overflow-y:auto; padding:18px; direction:rtl; text-align:right;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0; color:#1b5e20;">${name}</h3>
        <button id="closeModalBtn" style="background:#2e7d32; color:#fff; border:none; border-radius:6px; padding:6px 14px; font-weight:bold; cursor:pointer;">بازگشت ✕</button>
      </div>
      <img src="${img}" onerror="this.src='${DEFAULT_IMG}'" style="width:100%; height:180px; object-fit:cover; border-radius:10px; margin-bottom:12px;">
      <div style="background:#e8f5e9; color:#1b5e20; display:inline-block; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:bold; margin-bottom:10px;">طبع: ${nature}</div>
      <div style="font-size:13px; line-height:1.8; color:#333; margin-bottom:14px;">${desc}</div>
      <div id="wikiBox" style="background:#f5f5f5; border-right:3px solid #2e7d32; padding:10px; font-size:12px; line-height:1.6; color:#555;">
        در حال استعلام توضیحات بیشتر از دانشنامه...
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  getEl('closeModalBtn').onclick = () => { modal.style.display = 'none'; };

  // استعلام اطلاعات بیشتر
  const cleanName = name.split('(')[0].trim();
  fetch(`https://fa.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`)
    .then(r => r.json())
    .then(data => {
      const wEl = getEl('wikiBox');
      if (wEl) {
        wEl.innerHTML = data.extract ? `<strong>توضیحات تکمیلی:</strong><br>${data.extract}` : "توضیحات بیشتری یافت نشد.";
      }
    })
    .catch(() => {
      const wEl = getEl('wikiBox');
      if (wEl) wEl.textContent = "برای دریافت اطلاعات بیشتر دانشنامه، اتصال اینترنت را بررسی کنید.";
    });
}

// شروع
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}
