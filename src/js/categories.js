const ENTRIES_URL = 'data/entries.json?_=' + Date.now();

/**
 * Load entries and compute counts per category
 */
async function loadCounts() {
  try {
    const res = await fetch(ENTRIES_URL);
    const data = await res.json();
    const entries = data.entries || data;
    const counts = {};
    entries.forEach(e => {
      if (e.categories && Array.isArray(e.categories)) {
        e.categories.forEach(cat => {
          counts[cat] = (counts[cat] || 0) + 1;
        });
      }
    });
    return counts;
  } catch (e) {
    console.warn('无法加载条目数量:', e);
    return {};
  }
}

/**
 * Convert cat-item elements into bookmark-style cards with theme colors
 */
function transformCards(counts) {
  const items = document.querySelectorAll('.cat-item');
  items.forEach((item, i) => {
    item.classList.add('bookmark-card');
    
    if (!item.classList.contains('all-cat')) {
      item.classList.add('theme-' + ((i % 8) + 1));
    }
    
    const nameEl = item.querySelector('.name');
    const name = nameEl ? nameEl.textContent : item.dataset.cat;
    
    // Get real count from data, or fallback to hardcoded
    const cat = item.dataset.cat;
    let countText = '';
    if (cat === '' && item.classList.contains('all-cat')) {
      // 全部 — sum all
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      countText = total + ' 条';
    } else if (counts[cat] !== undefined) {
      countText = counts[cat] + ' 条';
    } else {
      // fallback to existing .count text
      const countEl = item.querySelector('.count');
      countText = countEl ? countEl.textContent : '';
    }
    
    // Rebuild card
    item.innerHTML = '';
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'card-cat-name';
    nameSpan.textContent = name;
    item.appendChild(nameSpan);
    
    const countSpan = document.createElement('div');
    countSpan.className = 'card-cat-count';
    countSpan.textContent = countText;
    item.appendChild(countSpan);
    
    const deco = document.createElement('div');
    deco.className = 'card-decoration';
    item.appendChild(deco);
  });
}

async function init() {
  const counts = await loadCounts();
  transformCards(counts);
  
  // Mouse wheel → smooth horizontal scroll (native smooth scroll)
  document.querySelectorAll('.card-grid').forEach(grid => {
    grid.addEventListener('wheel', (e) => {
      e.preventDefault();
      grid.scrollBy({ left: e.deltaY * 7.0, behavior: 'smooth' });
    }, { passive: false });
  });
  
  const catItems = document.querySelectorAll('.cat-item');
  catItems.forEach(item => {
    item.addEventListener('click', () => {
      const category = item.dataset.cat;
      localStorage.setItem('selected-category', category);
      window.location.href = 'index.html?_=' + Date.now();
    });
  });

  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html?_=' + Date.now();
  });
}

document.addEventListener('DOMContentLoaded', init);