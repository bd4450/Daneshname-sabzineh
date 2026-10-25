/* 
   app.js - موتور جستجو و نمایش گیاهان دارویی (نسخه نهایی بهینه‌شده برای ۲۰ هزار رکورد)
*/

const PAGE_SIZE = 40;
let ALL_DATA = [];           
let FILTERED_DATA = [];          
let renderedCount = 0;

const DEFAULT_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%25' height='100%25' fill='%23dcedc8'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='22' fill='%232e7d32'>🌿 گیاه دارویی</text></svg>";

const els = {
  grid: null,
  empty: null,
  q: null,
  status: null,
  loadMoreBtn: null,
  detailView: null
};

// اجرای اولیه بعد از بارگذاری کامل صفحه
document.addEventListener("DOMContentLoaded", () => {
  els.grid = document.getElementById('grid');
  els.status = document.getElementById('statusBar') || document.getElementById('status');
  els.q = document.getElementById('q') || document.getElementById('searchInput');
  els.loadMoreBtn = document.getElementById('loadMoreBtn');
  els.detailView = document.getElementById('detailView');

  // ساخت خودکار صفحه جزئیات اگر در html نبود
  if (!els.detailView) {
    createDetailOverlay();
  }

  initData();
  
  if (els.q) {
    let timer = null;
    els.q.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => handleSearch(e.target.value), 250);
    });
  }

  if (els.loadMoreBtn) {
    els.loadMoreBtn.addEventListener('click', renderMore);
  }
});

// ۱. دریافت فایل ۲۰ هزار تایی
async function initData() {
  if (els.status) els.status.textContent = "در حال بارگذاری داده‌های ۲۰ هزار گیاه...";
  try {
    const res = await fetch('herbs_20k.json');
    if (!res.ok) throw new Error("فایل herbs_20k.json یافت نشد!");
    ALL_DATA = await res.json();
    FILTERED_DATA = ALL_DATA;
    
    if (els.status) els.status.textContent = `تعداد کل گیاهان: ${ALL_DATA.length.toLocaleString('fa-IR')} مورد`;
    renderMore();
  } catch (err) {
    if (els.status) els.status.innerHTML = `<span style="color:red">خطا: ${err.message}</span>`;
  }
}

// ۲. نمایش کارتی گیاهان با دسته‌بندی صفحه‌بندی‌شده
function renderMore() {
  if (!els.grid) return;
  const nextBatch = FILTERED_DATA.slice(renderedCount, renderedCount + PAGE_SIZE);
  const frag = document.createDocumentFragment();

  nextBatch.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const title = item.name || item.title || "نامشخص";
    const nature = item.nature || item.temperament || "";
    const desc = item.properties || item.desc || item.benefits || "";
    const img = item.image || item.img || DEFAULT_IMG;

    card.innerHTML = `
      <img class="card-img" src="${img}" onerror="this.src='${DEFAULT_IMG}'" loading="lazy" style="width:100%; height:110px; object-fit:cover; background:#e8f5e9;">
      <div class="card-body" style="padding:10px;">
        <div class="card-title" style="font-size:1rem; font-weight:bold; margin-bottom:4px; color:#1b5e20;">${title}</div>
        ${nature ? `<div class="card-nature" style="font-size:0.75rem; color:#e65100; margin-bottom:6px;">طبع: ${nature}</div>` : ''}
        <div class="card-desc" style="font-size:0.8rem; color:#666; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${desc || 'برای توضیحات بیشتر کلیک کنید...'}</div>
      </div>
    `;
    card.style.cssText = "background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.07); cursor:pointer; display:flex; flex-direction:column;";
    card.onclick = () => openDetail(item);
    frag.appendChild(card);
  });

  els.grid.appendChild(frag);
  renderedCount += nextBatch.length;

  if (els.loadMoreBtn) {
    els.loadMoreBtn.style.display = renderedCount < FILTERED_DATA.length ? 'block' : 'none';
  }
}

// ۳. موتور جستجوی سریع
function handleSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    FILTERED_DATA = ALL_DATA;
  } else {
    FILTERED_DATA = ALL_DATA.filter(item => {
      const name = (item.name || item.title || "").toLowerCase();
      const nature = (item.nature || item.temperament || "").toLowerCase();
      const desc = (item.properties || item.desc || item.benefits || "").toLowerCase();
      return name.includes(q) || nature.includes(q) || desc.includes(q);
    });
  }
  if (els.grid) els.grid.innerHTML = '';
  renderedCount = 0;
  if (els.status) els.status.textContent = `یافت شد: ${FILTERED_DATA.length.toLocaleString('fa-IR')} گیاه`;
  renderMore();
}

// ۴. ساخت خودکار صفحه جزئیات (مایحتاج بخش نمایشی) اگر در HTML موجود نباشد
function createDetailOverlay() {
  const div = document.createElement('div');
  div.id = 'detailView';
  div.style.cssText = "display:none; position:fixed; inset:0; background:white; z-index:9999; overflow-y:auto; flex-direction:column;";
  div.innerHTML = `
    <div style="position:sticky; top:0; background:white; padding:12px 14px; border-bottom:1px solid #eee; display:flex; align-items:center; justify-content:space-between;">
      <span id="detailHeaderTitle" style="font-weight:bold; font-size:1.05rem;">جزئیات گیاه</span>
      <button onclick="closeDetail()" style="background:#2e7d32; color:white; border:none; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer;">بازگشت ➔</button>
    </div>
    <div style="padding:16px; max-width:650px; margin:0 auto; width:100%;">
      <img id="detailImage" src="" style="width:100%; max-height:260px; object-fit:cover; border-radius:12px; margin-bottom:14px; background:#e8f5e9;" onerror="this.src='${DEFAULT_IMG}'">
      <h2 id="detailTitle" style="margin:0 0 8px; color:#1b5e20;"></h2>
      <div id="detailNature" style="display:inline-block; background:#e8f5e9; color:#1b5e20; padding:4px 10px; border-radius:6px; font-size:0.8rem; font-weight:bold; margin-bottom:10px;"></div>
      <p id="detailDesc" style="line-height:1.7; font-size:0.95rem; margin-bottom:16px;"></p>
      <div style="margin-top:18px; padding:12px; background:#f9f9f9; border-right:4px solid #2e7d32; border-radius:6px; font-size:0.88rem; line-height:1.6;">
        <strong>اطلاعات تکمیلی دانشنامه:</strong>
        <p id="wikiText" style="margin:6px 0 0; color:#444;">در حال دریافت توضیحات تکمیلی...</p>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  els.detailView = div;
}

// ۵. باز کردن جزئیات و اتصال به ویکی‌پدیا
async function openDetail(item) {
  const title = item.name || item.title || "بدون نام";
  
  const elHeaderTitle = document.getElementById('detailHeaderTitle');
  const elTitle = document.getElementById('detailTitle');
  const elNature = document.getElementById('detailNature');
  const elDesc = document.getElementById('detailDesc');
  const elImg = document.getElementById('detailImage');
  const wikiText = document.getElementById('wikiText');

  if (elHeaderTitle) elHeaderTitle.textContent = title;
  if (elTitle) elTitle.textContent = title;
  if (elNature) elNature.textContent = item.nature ? `طبع: ${item.nature}` : 'طبع نامشخص';
  if (elDesc) elDesc.textContent = item.properties || item.desc || item.benefits || 'توضیحات محلی ثبت نشده است.';
  if (elImg) elImg.src = item.image || item.img || DEFAULT_IMG;
  if (wikiText) wikiText.textContent = "در حال بارگذاری دانشنامه آنلاین...";

  if (els.detailView) {
    els.detailView.style.display = 'flex';
    window.history.pushState({ modal: true }, "");
  }

  // گرفتن اطلاعات تکمیلی از ویکی‌پدیا فارسی
  try {
    const cleanName = title.split('(')[0].trim();
    const wikiRes = await fetch(`https://fa.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiText) wikiText.innerHTML = wikiData.extract ? wikiData.extract : "توضیحات تکمیلی برای این گیاه در سرور یافت نشد.";
      if (wikiData.thumbnail && wikiData.thumbnail.source && elImg && !item.image && !item.img) {
        elImg.src = wikiData.thumbnail.source;
      }
    } else {
      if (wikiText) wikiText.textContent = "توضیح بیشتری برای این مورد ثبت نشده است.";
    }
  } catch (e) {
    if (wikiText) wikiText.textContent = "برای مشاهده اطلاعات تکمیلی به اینترنت متصل شوید.";
  }
}

function closeDetail() {
  if (els.detailView) {
    els.detailView.style.display = 'none';
  }
}

// بستن با دکمه بازگشت گوشی
window.addEventListener('popstate', () => {
  closeDetail();
});
