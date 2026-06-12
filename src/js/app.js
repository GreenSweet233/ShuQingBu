const DB_NAME = 'shuqingbu';
const DB_VER = 1;
let entries = [];
let currentIndex = -1;
let currentFiltered = [];
let currentCategory = '';
let favFilter = false;
let excerptFilter = false;
let isListView = false;
let favorites = new Set();
let keepReadingPosition = false;

// --- Init IndexedDB ---
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFavorites(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const req = store.getAll();
    req.onsuccess = () => {
      favorites = new Set(req.result.map(r => r.id));
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

async function toggleFavorite(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    if (favorites.has(id)) {
      store.delete(id);
      favorites.delete(id);
    } else {
      store.put({ id });
      favorites.add(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Reading Position ---
function saveReadingPosition() {
  if (!keepReadingPosition) return;
  const position = {
    entryId: currentFiltered[currentIndex]?.id || null,
    category: currentCategory,
    view: isListView ? 'list' : 'card',
    favFilter: favFilter,
    excerptFilter: excerptFilter,
    timestamp: Date.now()
  };
  localStorage.setItem('shuqingbu-position', JSON.stringify(position));
}

function loadReadingPosition() {
  const saved = localStorage.getItem('shuqingbu-position');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function toggleKeepPosition() {
  keepReadingPosition = !keepReadingPosition;
  localStorage.setItem('shuqingbu-keep-position', keepReadingPosition ? 'true' : 'false');
  updateKeepPositionUI();
  showToast(keepReadingPosition ? '已开启阅读位置记忆' : '已关闭阅读位置记忆');
}

function updateKeepPositionUI() {
  const toggle = document.getElementById('keepPositionToggle');
  const status = document.getElementById('keepPositionStatus');
  if (toggle) {
    toggle.classList.toggle('active', keepReadingPosition);
  }
  if (status) {
    status.textContent = keepReadingPosition ? '开启' : '关闭';
  }
}

function initKeepPosition() {
  const saved = localStorage.getItem('shuqingbu-keep-position');
  keepReadingPosition = saved !== 'false';
  updateKeepPositionUI();
}

// --- Theme ---
function initTheme() {
  const saved = localStorage.getItem('theme');
  const isLight = saved === 'light';
  if (isLight) {
    document.documentElement.classList.add('light');
    document.querySelector('meta[name="theme-color"]').content = '#f5f0eb';
  } else {
    document.querySelector('meta[name="theme-color"]').content = '#1a1a2e';
  }
  updateThemeUI();
}

function updateThemeUI() {
  const isLight = document.documentElement.classList.contains('light');
  const toggle = document.getElementById('themeToggle');
  const status = document.getElementById('themeStatus');
  if (toggle) {
    toggle.classList.toggle('active', !isLight);
  }
  if (status) {
    status.textContent = isLight ? '关闭' : '开启';
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  document.querySelector('meta[name="theme-color"]').content = isLight ? '#f5f0eb' : '#1a1a2e';
  updateThemeUI();
}

// --- Load Data ---
async function init() {
  const db = await openDB();
  await loadFavorites(db);

  const resp = await fetch('data/entries.json');
  entries = await resp.json();

  initKeepPosition();
  renderCategories();
  applyFilters();
  
  const position = loadReadingPosition();
  if (keepReadingPosition && position && position.entryId) {
    restorePosition(position);
  } else {
    randomEntry();
  }
  
  bindEvents(db);
  initTheme();
}

function restorePosition(position) {
  if (position.category !== undefined) {
    currentCategory = position.category;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    const catBtn = document.querySelector(`.cat-btn[data-cat="${position.category}"]`) || document.querySelector('.cat-btn[data-cat=""]');
    if (catBtn) catBtn.classList.add('active');
  }
  
  if (position.favFilter !== undefined) {
    favFilter = position.favFilter;
    const btn = document.getElementById('favFilterBtn');
    if (favFilter) btn.classList.add('active');
    else btn.classList.remove('active');
  }
  
  if (position.excerptFilter !== undefined) {
    excerptFilter = position.excerptFilter;
    const btn = document.getElementById('excerptFilterBtn');
    if (excerptFilter) btn.classList.add('active');
    else btn.classList.remove('active');
  }
  
  applyFilters();
  
  if (position.entryId) {
    const idx = currentFiltered.findIndex(e => e.id === position.entryId);
    if (idx >= 0) {
      currentIndex = idx;
      renderEntry(currentFiltered[idx]);
    } else {
      randomEntry();
    }
  } else {
    randomEntry();
  }
  
  if (position.view === 'list') {
    isListView = true;
    document.getElementById('viewToggleBtn').textContent = '📖';
    renderList();
  } else {
    isListView = false;
    document.getElementById('viewToggleBtn').textContent = '📋';
    showCardView();
  }
}

// --- Category rendering ---
function getAllCategoryNames() {
  const set = new Set();
  entries.forEach(e => e.categories.forEach(c => set.add(c)));
  const sorted = Array.from(set).sort((a,b) => {
    const countA = entries.filter(e => e.categories.includes(a)).length;
    const countB = entries.filter(e => e.categories.includes(b)).length;
    return countB - countA;
  });
  return sorted;
}

function renderCategories() {
  const cats = getAllCategoryNames();
  const bar = document.getElementById('categoryBar');
  bar.innerHTML = `<button class="cat-btn${currentCategory === '' ? ' active' : ''}" data-cat="">全部</button>`;
  cats.forEach(c => {
    const count = entries.filter(e => e.categories.includes(c)).length;
    const btn = document.createElement('button');
    btn.className = `cat-btn${currentCategory === c ? ' active' : ''}`;
    btn.dataset.cat = c;
    btn.innerHTML = `${c} <span class="cat-count">${count}</span>`;
    bar.appendChild(btn);
  });
}

// --- Filtering ---
function applyFilters() {
  let filtered = entries;

  if (currentCategory) {
    filtered = filtered.filter(e => e.categories.includes(currentCategory));
  }
  if (favFilter) {
    filtered = filtered.filter(e => favorites.has(e.id));
  }
  if (excerptFilter) {
    filtered = filtered.filter(e => e.is_excerpt);
  }
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(e => e.content.toLowerCase().includes(q));
  }

  currentFiltered = filtered;

  const stats = document.getElementById('statsLabel');
  stats.textContent = `${currentFiltered.length} / ${entries.length}`;

  if (currentFiltered.length === 0) {
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('entryContent').textContent = '';
    document.getElementById('entryMeta').innerHTML = '';
  } else {
    document.getElementById('emptyState').style.display = 'none';
  }

  if (isListView) renderList();
}

function navigateTo(index) {
  if (currentFiltered.length === 0) return;
  if (index < 0) index = currentFiltered.length - 1;
  if (index >= currentFiltered.length) index = 0;
  currentIndex = index;
  renderEntry(currentFiltered[currentIndex]);
  saveReadingPosition();
}

function renderEntry(entry) {
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('entryContent').innerHTML = `<div class="entry-num">#${entry.id}（${currentIndex + 1}/${currentFiltered.length}）</div>${escHtml(entry.content)}`;

  const meta = document.getElementById('entryMeta');
  let html = '';
  if (entry.date) html += `<span class="date">${entry.date}</span>`;
  if (entry.is_excerpt) {
    html += `<span class="tag excerpt">摘录</span>`;
  }
  entry.categories.forEach(c => {
    html += `<span class="tag">${c}</span>`;
  });
  meta.innerHTML = html;

  const favBtn = document.getElementById('favBtn');
  if (favorites.has(entry.id)) {
    favBtn.innerHTML = '<span class="icon">⭐</span> 已收集';
    favBtn.className = 'action-btn faved';
  } else {
    favBtn.innerHTML = '<span class="icon">☆</span> 收集';
    favBtn.className = 'action-btn';
  }
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function randomEntry() {
  if (currentFiltered.length === 0) {
    showToast('没有匹配的条目');
    return;
  }
  const idx = Math.floor(Math.random() * currentFiltered.length);
  currentIndex = idx;
  renderEntry(currentFiltered[idx]);
  saveReadingPosition();
  if (isListView) renderList();
}

// --- List View ---
function renderList() {
  const container = document.getElementById('listView');
  container.style.display = 'flex';
  document.getElementById('cardView').style.display = 'none';

  container.innerHTML = currentFiltered.map((e, i) => {
    const cats = e.categories.map(c => `<span>${c}</span>`).join('');
    const fav = favorites.has(e.id) ? '⭐' : '☆';
    const excerpt = e.is_excerpt ? ' 📝' : '';
    const text = e.content.length > 100 ? e.content.slice(0, 100) + '…' : e.content;
    const active = i === currentIndex ? ' style="border-left:3px solid var(--accent);"' : '';
    return `<div class="list-item" data-idx="${i}"${active}>
      <div class="item-date">#${e.id} &middot; ${e.date || '无日期'}${excerpt}</div>
      <div>${escHtml(text)}</div>
      <div class="item-cats">${cats}</div>
      <span class="item-fav" data-idx2="${i}">${fav}</span>
    </div>`;
  }).join('');
  const activeItem = container.querySelector('.list-item[style*="accent"]');
  if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function showCardView() {
  document.getElementById('listView').style.display = 'none';
  document.getElementById('cardView').style.display = 'flex';
  if (currentFiltered.length > 0 && currentIndex >= 0) {
    renderEntry(currentFiltered[currentIndex]);
  }
}

// --- Import / Export Favorites ---
async function exportFavorites() {
  const ids = Array.from(favorites);
  if (ids.length === 0) { showToast('没有收集的条目'); return; }
  const text = ids.join(',');
  await navigator.clipboard.writeText(text);
  showToast(`已复制 ${ids.length} 个收集ID`);
}

async function importFavorites(db) {
  const input = prompt('粘贴收集ID，用逗号分隔，例如： 1,5,23,42');
  if (!input) return;
  const ids = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  if (ids.length === 0) { showToast('未识别到有效ID'); return; }
  const tx = db.transaction('favorites', 'readwrite');
  const store = tx.objectStore('favorites');
  ids.forEach(id => store.put({ id }));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  ids.forEach(id => favorites.add(id));
  showToast(`导入了 ${ids.length} 个收集`);
  applyFilters();
  if (currentFiltered.length > 0) randomEntry();
}

// --- Toast ---
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2000);
}

// --- Events ---
function bindEvents(db) {
  document.getElementById('categoryBar').addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.cat === '全部' ? '' : btn.dataset.cat;
    applyFilters();
    if (currentFiltered.length > 0) randomEntry();
  });

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const val = document.getElementById('searchInput').value.trim();
    if (val.startsWith('#')) {
      const numStr = val.slice(1);
      const targetId = parseInt(numStr, 10);
      if (!isNaN(targetId)) {
        const idx = currentFiltered.findIndex(e => e.id === targetId);
        if (idx === -1) {
          const globalIdx = entries.findIndex(e => e.id === targetId);
          if (globalIdx === -1) { showToast(`未找到 #${targetId}`); return; }
          currentCategory = '';
          document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
          document.querySelector('.cat-btn[data-cat=""]')?.classList.add('active');
          applyFilters();
        }
        const newIdx = currentFiltered.findIndex(e => e.id === targetId);
        if (newIdx >= 0) {
          currentIndex = newIdx;
          if (isListView) { isListView = false; showCardView(); document.getElementById('viewToggleBtn').textContent = '📋'; }
          renderEntry(currentFiltered[currentIndex]);
          saveReadingPosition();
          document.getElementById('searchInput').value = '';
        }
      }
    }
  });

  document.getElementById('searchInput').addEventListener('input', () => {
    const val = document.getElementById('searchInput').value.trim();
    if (val.startsWith('#')) return;
    applyFilters();
    if (currentFiltered.length > 0 && currentIndex >= currentFiltered.length) {
      currentIndex = 0;
    }
    if (isListView) renderList();
    else if (currentFiltered.length > 0 && currentIndex >= 0) {
      const currentId = currentFiltered[currentIndex]?.id;
      const stillIn = currentFiltered.findIndex(e => e.id === currentId);
      if (stillIn >= 0) currentIndex = stillIn;
      else currentIndex = 0;
      renderEntry(currentFiltered[currentIndex]);
      saveReadingPosition();
    }
  });

  document.getElementById('randomBtn').addEventListener('click', randomEntry);

  document.getElementById('prevBtn').addEventListener('click', () => navigateTo(currentIndex - 1));
  document.getElementById('nextBtn').addEventListener('click', () => navigateTo(currentIndex + 1));

  document.getElementById('favBtn').addEventListener('click', async () => {
    if (currentFiltered.length === 0 || currentIndex < 0) return;
    const entry = currentFiltered[currentIndex];
    await toggleFavorite(db, entry.id);
    renderEntry(entry);
    if (isListView) renderList();
    showToast(favorites.has(entry.id) ? '已收集 ⭐' : '已取消收集');
  });

  document.getElementById('favFilterBtn').addEventListener('click', () => {
    favFilter = !favFilter;
    document.getElementById('favFilterBtn').classList.toggle('active');
    applyFilters();
    if (currentFiltered.length > 0) randomEntry();
  });

  document.getElementById('excerptFilterBtn').addEventListener('click', () => {
    excerptFilter = !excerptFilter;
    document.getElementById('excerptFilterBtn').classList.toggle('active');
    applyFilters();
    if (currentFiltered.length > 0) randomEntry();
  });

  document.getElementById('categoryBar').addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  // Sidebar
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  
  function openSidebar() {
    sidebar.classList.add('show');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  
  function closeSidebar() {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  
  document.getElementById('menuBtn').addEventListener('click', openSidebar);
  document.getElementById('closeSidebarBtn').addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
  
  document.getElementById('keepPositionItem').addEventListener('click', toggleKeepPosition);
  document.getElementById('themeItem').addEventListener('click', toggleTheme);
  
  document.getElementById('exportItem').addEventListener('click', () => {
    exportFavorites();
    closeSidebar();
  });
  
  document.getElementById('importItem').addEventListener('click', () => {
    importFavorites(db);
    closeSidebar();
  });
  
  document.getElementById('clearPositionItem').addEventListener('click', () => {
    localStorage.removeItem('shuqingbu-position');
    showToast('已清除阅读位置');
    closeSidebar();
  });

  document.getElementById('viewToggleBtn').addEventListener('click', () => {
    isListView = !isListView;
    if (isListView) {
      document.getElementById('viewToggleBtn').textContent = '📖';
      renderList();
    } else {
      document.getElementById('viewToggleBtn').textContent = '📋';
      showCardView();
    }
    saveReadingPosition();
  });

  document.getElementById('listView').addEventListener('click', (e) => {
    const item = e.target.closest('.list-item');
    const fav = e.target.closest('.item-fav');
    if (fav) {
      const idx = parseInt(fav.dataset.idx2);
      const entry = currentFiltered[idx];
      if (entry) {
        toggleFavorite(db, entry.id).then(() => {
          renderList();
          showToast(favorites.has(entry.id) ? '已收集 ⭐' : '已取消收集');
        });
      }
      return;
    }
    if (item) {
      currentIndex = parseInt(item.dataset.idx);
      isListView = false;
      showCardView();
      renderEntry(currentFiltered[currentIndex]);
      saveReadingPosition();
      document.getElementById('viewToggleBtn').textContent = '📋';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') navigateTo(currentIndex - 1);
    if (e.key === 'ArrowRight') navigateTo(currentIndex + 1);
    if (e.key === ' ') { e.preventDefault(); randomEntry(); }
    if (e.key === 'f' || e.key === 'F') document.getElementById('favBtn').click();
  });
}

init();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { scope: '.' });
}