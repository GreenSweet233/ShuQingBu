function init() {
  const catItems = document.querySelectorAll('.cat-item');
  catItems.forEach(item => {
    item.addEventListener('click', () => {
      const category = item.dataset.cat;
      localStorage.setItem('selected-category', category);
      // 加时间戳绕过 Service Worker 缓存
      window.location.href = 'index.html?_=' + Date.now();
    });
  });

  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

document.addEventListener('DOMContentLoaded', init);
