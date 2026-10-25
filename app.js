/* 
   app.js - نسخه نهایی با پشتیبانی از کلیدهای مختلف داده‌های ۲۰ هزارتایی
*/

const PAGE_SIZE = 50;
let ALL = [];
let VIEW = [];
let page = 0;

const DEFAULT_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='100' viewBox='0 0 150 100'><rect width='100%25' height='100%25' fill='%23e8f5e9'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='15' fill='%232e7d32'>🌿 گیاه دارویی</text></svg>";

// تابع کمکی برای استخراج امن متن از آیتم‌ها (پشتیبانی از نام‌های مختلف کلیدها)
function getField(item, keys) {
  for (let k of keys) {
    if (item[k] !== undefined && item[k] !== null && item[k] !== "") {
      return item[k];
    }
  }
  return "";
}

async function loadData() {
  if (window.herbsData && Array.isArray(window.herbsData)) {
    ALL = window.herbsData;
  } else if (window.ALL && Array.isArray(window.ALL)) {
    ALL = window.ALL;
  } else if (window.data && Array.isArray(window.data)) {
    ALL = window.data;
  } else {
    const files = ['herbs_20k.json', 'herbs._20k.json', 'herbs_sample.json'];
    for (let f of files) {
      try {
        const res = await fetch(f + '?v=' + Date.now());
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

function updateCount() {
  const countText = `${VIEW.length.toLocaleString('fa-IR')} گیاه`;
  
  // آپدیت تمام بخش‌هایی که ظرفیت را نشان می‌دهند
  const allDivs = document.querySelectorAll('div, span, p');
  allDivs.forEach(el => {
    if (el.textContent && (el.textContent.includes('ظرفیت فعال') || el.textContent.includes('مورد'))) {
      if (el.id === 'count' || el.classList.contains('capacity') || el.textContent.length < 35) {
        el.textContent = `ظرفیت فعال: ${countText}`;
      }
    }
  });
}

function renderGrid(reset = false) {
  let grid = document.getElementById('grid') || document.getElementById('list') || document.querySelector('.grid');
  if (!grid) return;

  if (reset) {
    grid.innerHTML = '';
    page = 0;
  }

  const start = page * PAGE_SIZE;
  const items = VIEW.slice(start, start + PAGE_SIZE);

  const frag = document.createDocumentFragment();
  items.forEach(item => {
    // بررسی تمام کلیدهای احتمالی برای نام، طبع و توضیحات
    const name = getField(item, ['name', 'title', 'farsi', 'نام', 'عنوان', 'plant_name']) || "بدون نام";
    const nature = getField(item, ['nature', 'temperament', 'tab', 'طبع', 'مزاج']);
    const desc = getField(item, ['properties', 'desc', 'benefits', 'khavas', 'خواص', 'توضیحات', 'summary']);
    const img = getField(item, ['image', 'img', 'pic', 'photo', 'تصویر']) || DEFAULT_IMG;

    const card = document.createElement('div');
    card.style.cssText = "background:#fff; border-radius:10px; border:1px solid #e2e8f0; padding:10px; margin-bottom:10px; cursor:pointer; display:flex; gap:12px; align-items:center;";
    
    card.innerHTML = `
      <img src="${img}" onerror="this.src='${DEFAULT_IMG}'" style="width:75px; height:75px; object-fit:cover; border-radius:8px; background:#f1f5f9; flex-shrink:0;">
      <div style="flex-grow:1; text-align:right;">
        <div style="font-weight:bold; font-size:15px; color:#1b5e20;">${name}</div>
        ${nature ? `<div style="font-size:12px; color:#d97706; margin:3px 0;">طبع: ${nature}</div>` : ''}
        <div style="font-size:12px; color:#64748b; line-height:1.4; max-height:34px; overflow:hidden;">${desc || 'برای توضیحات بیشتر لمس کنید...'}</div>
      </div>
    `;

    card.onclick = () => openDetailPage(item);
    frag.appendChild(card);
  });

  grid.appendChild(frag);
  page++;
}

function setupEvents() {
  let qInput = document.getElementById('q') || document.getElementById('searchInput') || document.querySelector('input[type="text"]');
  if (qInput) {
    let timer = null;
    qInput.oninput = (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const query = qInput.value.trim().toLowerCase();
        VIEW = ALL.filter(item => {
          const name = getField(item, ['name', 'title', 'farsi', 'نام', 'عنوان']).toLowerCase();
          const nat = getField(item, ['nature', 'temperament', 'tab', 'طبع']).toLowerCase();
          const desc = getField(item, ['properties', 'desc', 'benefits', 'khavas', 'خواص']).toLowerCase();
          return !query || name.includes(query) || nat.includes(query) || desc.includes(query);
        });
        updateCount();
        renderGrid(true);
      }, 200);
    };
  }

  // اسکرول بی‌نهایت برای بارگذاری بقیه موارد
  window.onscroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
      if ((page * PAGE_SIZE) < VIEW.length) {
        renderGrid(false);
      }
    }
  };
}

function openDetailPage(item) {
  let modal = document.getElementById('customModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customModal';
    modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:99999; display:flex; justify-content:center; align-items:center; padding:12px;";
    document.body.appendChild(modal);
  }

  const name = getField(item, ['name', 'title', 'farsi', 'نام', 'عنوان']) || "نام گیاه";
  const nature = getField(item, ['nature', 'temperament', 'tab', 'طبع']) || "نامشخص";
  const desc = getField(item, ['properties', 'desc', 'benefits', 'khavas', 'خواص', 'توضیحات']) || "توضیحاتی ثبت نشده است.";
  const img = getField(item, ['image', 'img', 'pic', 'photo']) || DEFAULT_IMG;

  modal.innerHTML = `
    <div style="background:#fff; border-radius:12px; width:100%; max-width:500px; max-height:88vh; overflow-y:auto; padding:16px; direction:rtl; text-align:right;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:12px;">
        <h3 style="margin:0; color:#1b5e20; font-size:1.1rem;">${name}</h3>
        <button id="closeBtn" style="background:#2e7d32; color:#fff; border:none; border-radius:6px; padding:6px 14px; font-weight:bold; cursor:pointer;">بازگشت ✕</button>
      </div>
      <img src="${img}" onerror="this.src='${DEFAULT_IMG}'" style="width:100%; height:190px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
      <div style="background:#e8f5e9; color:#1b5e20; display:inline-block; padding:4px 10px; border-radius:6px; font-size:0.8rem; font-weight:bold; margin-bottom:10px;">طبع: ${nature}</div>
      <div style="font-size:13.5px; line-height:1.8; color:#333;">${desc}</div>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById('closeBtn').onclick = () => {
    modal.style.display = 'none';
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}
