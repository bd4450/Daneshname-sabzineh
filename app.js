<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>دانشنامه گیاهان دارویی سبزینه</title>
  <style>
    :root {
      --primary: #2e7d32;
      --primary-dark: #1b5e20;
      --accent: #81c784;
      --bg: #f4f6f8;
      --card-bg: #ffffff;
      --text: #212121;
      --text-muted: #666;
    }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; background-color: var(--bg); color: var(--text); padding-bottom: 30px; }
    
    header {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white; padding: 18px 14px; text-align: center;
      position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    header h1 { margin: 0; font-size: 1.25rem; }
    header p { margin: 4px 0 0; font-size: 0.8rem; opacity: 0.9; }

    .search-panel {
      padding: 12px 14px; background: white; border-bottom: 1px solid #e0e0e0;
      display: flex; flex-direction: column; gap: 8px;
    }
    .search-input {
      width: 100%; padding: 11px 14px; border: 1px solid #ccc;
      border-radius: 10px; font-size: 0.95rem; outline: none;
    }
    .search-input:focus { border-color: var(--primary); }
    .status-bar { font-size: 0.8rem; color: var(--text-muted); padding: 0 4px; }

    .grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px; padding: 14px;
    }
    .card {
      background: var(--card-bg); border-radius: 12px; overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.07); cursor: pointer;
      display: flex; flex-direction: column; transition: transform 0.15s ease;
    }
    .card:active { transform: scale(0.97); }
    .card-img {
      width: 100%; height: 110px; object-fit: cover; background: #e8f5e9;
    }
    .card-body { padding: 10px; flex-grow: 1; display: flex; flex-direction: column; }
    .card-title { font-size: 1rem; font-weight: bold; margin: 0 0 4px; color: var(--primary-dark); }
    .card-nature { font-size: 0.75rem; color: #e65100; margin-bottom: 6px; }
    .card-desc {
      font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden; text-overflow: ellipsis;
    }

    /* صفحه جزئیات */
    .detail-overlay {
      display: none; position: fixed; inset: 0; background: white;
      z-index: 200; overflow-y: auto; flex-direction: column;
    }
    .detail-overlay.active { display: flex; }
    .detail-header {
      position: sticky; top: 0; background: white; padding: 12px 14px;
      border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;
      z-index: 10;
    }
    .back-btn {
      background: var(--primary); color: white; border: none; padding: 8px 16px;
      border-radius: 8px; font-size: 0.9rem; cursor: pointer; font-weight: bold;
    }
    .detail-body { padding: 16px; max-width: 650px; margin: 0 auto; width: 100%; }
    .detail-img {
      width: 100%; max-height: 260px; object-fit: cover; border-radius: 12px;
      margin-bottom: 14px; background: #e8f5e9;
    }
    .badge {
      display: inline-block; background: #e8f5e9; color: var(--primary-dark);
      padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; margin-bottom: 10px;
    }
    .wiki-box {
      margin-top: 18px; padding: 12px; background: #f9f9f9;
      border-right: 4px solid var(--primary); border-radius: 6px; font-size: 0.88rem; line-height: 1.6;
    }
    .load-more-btn {
      display: block; width: 90%; max-width: 280px; margin: 15px auto;
      padding: 11px; background: white; border: 1px solid var(--primary);
      color: var(--primary); border-radius: 8px; font-weight: bold; cursor: pointer;
    }
  </style>
</head>
<body>

  <header>
    <h1>🌿 دانشنامه سبزینه</h1>
    <p>بانک جامع اطلاعات گیاهان دارویی</p>
  </header>

  <div class="search-panel">
    <input type="text" id="searchInput" class="search-input" placeholder="جستجوی نام گیاه، طبع یا خواص...">
    <div id="statusBar" class="status-bar">در حال دریافت داده‌ها...</div>
  </div>

  <main>
    <div id="grid" class="grid"></div>
    <button id="loadMoreBtn" class="load-more-btn" style="display: none;">نمایش موارد بیشتر...</button>
  </main>

  <!-- صفحه نمایش کامل جزئیات -->
  <div id="detailView" class="detail-overlay">
    <div class="detail-header">
      <span id="detailHeaderTitle" style="font-weight: bold; font-size: 1.05rem;">جزئیات گیاه</span>
      <button class="back-btn" onclick="closeDetail()">بازگشت ➔</button>
    </div>
    <div class="detail-body">
      <img id="detailImage" class="detail-img" src="" alt="">
      <h2 id="detailTitle" style="margin: 0 0 8px; color: var(--primary-dark);"></h2>
      <div id="detailNature" class="badge"></div>
      <p id="detailDesc" style="line-height: 1.7; font-size: 0.95rem; margin-bottom: 16px;"></p>
      
      <!-- اطلاعات تکمیلی از دانشنامه / ویکی‌پدیا -->
      <div id="wikiSection" class="wiki-box">
        <strong>اطلاعات تکمیلی دانشنامه:</strong>
        <p id="wikiText" style="margin: 6px 0 0; color: #444;">در حال دریافت توضیحات تکمیلی از دانشنامه...</p>
      </div>
    </div>
  </div>

  <script>
    const PAGE_SIZE = 40;
    let ALL_DATA = [];
    let FILTERED_DATA = [];
    let renderedCount = 0;

    const elGrid = document.getElementById('grid');
    const elSearch = document.getElementById('searchInput');
    const elStatus = document.getElementById('statusBar');
    const elLoadMore = document.getElementById('loadMoreBtn');
    const elDetail = document.getElementById('detailView');

    // عکس پیش‌فرض باکیفیت و بدون نیاز به اینترنت برای مواقعی که عکس نیست
    const DEFAULT_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%25' height='100%25' fill='%23dcedc8'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='22' fill='%232e7d32'>🌿 گیاه دارویی</text></svg>";

    // ۱. دریافت فایل ۲۰ هزار تایی
    async function init() {
      try {
        // نام فایل دقیقاً با فایل جیسون ۲۰ هزاری شما تنظیم شده
        const res = await fetch('herbs_20k.json');
        if (!res.ok) throw new Error("فایل herbs_20k.json در کنار فایل html پیدا نشد!");
        ALL_DATA = await res.json();
        
        FILTERED_DATA = ALL_DATA;
        elStatus.textContent = `تعداد کل گیاهان: ${ALL_DATA.length.toLocaleString('fa-IR')} مورد`;
        renderMore();
      } catch (err) {
        elStatus.innerHTML = `<span style="color:red">خطا در بارگذاری: ${err.message}</span>`;
      }
    }

    // ۲. نمایش کارتی گیاهان
    function renderMore() {
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
          <img class="card-img" src="${img}" onerror="this.src='${DEFAULT_IMG}'" loading="lazy">
          <div class="card-body">
            <div class="card-title">${title}</div>
            ${nature ? `<div class="card-nature">طبع: ${nature}</div>` : ''}
            <div class="card-desc">${desc || 'برای توضیحات بیشتر کلیک کنید...'}</div>
          </div>
        `;
        card.onclick = () => openDetail(item);
        frag.appendChild(card);
      });

      elGrid.appendChild(frag);
      renderedCount += nextBatch.length;

      elLoadMore.style.display = renderedCount < FILTERED_DATA.length ? 'block' : 'none';
    }

    // ۳. موتور جستجوی سریع و بدون لگ برای ۲۰ هزار داده
    let timer = null;
    elSearch.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          FILTERED_DATA = ALL_DATA;
        } else {
          FILTERED_DATA = ALL_DATA.filter(item => {
            const name = (item.name || item.title || "").toLowerCase();
            const nature = (item.nature || item.temperament || "").toLowerCase();
            const desc = (item.properties || item.desc || item.benefits || "").toLowerCase();
            return name.includes(query) || nature.includes(query) || desc.includes(query);
          });
        }
        elGrid.innerHTML = '';
        renderedCount = 0;
        elStatus.textContent = `یافت شد: ${FILTERED_DATA.length.toLocaleString('fa-IR')} گیاه`;
        renderMore();
      }, 250);
    });

    elLoadMore.addEventListener('click', renderMore);

    // ۴. باز کردن جزئیات و استخراج توضیحات تکمیلی
    async function openDetail(item) {
      const title = item.name || item.title || "بدون نام";
      document.getElementById('detailHeaderTitle').textContent = title;
      document.getElementById('detailTitle').textContent = title;
      document.getElementById('detailNature').textContent = item.nature ? `طبع: ${item.nature}` : 'طبع نامشخص';
      document.getElementById('detailDesc').textContent = item.properties || item.desc || item.benefits || 'توضیحات محلی ثبت نشده است.';
      document.getElementById('detailImage').src = item.image || item.img || DEFAULT_IMG;

      const wikiText = document.getElementById('wikiText');
      wikiText.textContent = "در حال بارگذاری دانشنامه آنلاین...";

      elDetail.classList.add('active');
      window.history.pushState({ modal: true }, "");

      // استعلام آنلاین از دانشنامه ویکی‌پدیا برای توضیحات بیشتر
      try {
        const cleanName = title.split('(')[0].trim();
        const wikiRes = await fetch(`https://fa.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          wikiText.innerHTML = wikiData.extract ? wikiData.extract : "توضیحات تکمیلی برای این گیاه در سرور یافت نشد.";
          if (wikiData.thumbnail && wikiData.thumbnail.source && (!item.image && !item.img)) {
            document.getElementById('detailImage').src = wikiData.thumbnail.source;
          }
        } else {
          wikiText.textContent = "توضیح بیشتری برای این مورد ثبت نشده است.";
        }
      } catch (e) {
        wikiText.textContent = "برای مشاهده اطلاعات تکمیلی به اینترنت متصل شوید.";
      }
    }

    function closeDetail() {
      elDetail.classList.remove('active');
    }

    // بستن پنجره با دکمه بازگشت گوشی (Back فیزیکی)
    window.addEventListener('popstate', () => {
      closeDetail();
    });

    // شروع برنامه
    init();
  </script>
</body>
</html>
