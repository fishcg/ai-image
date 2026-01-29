/* 首页逻辑 - 画廊展示 */

let currentUser = null;
let currentFilter = 'all';
let isLoading = false;
let hasMore = true;
let currentOffset = 0;
const LIMIT = 20;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupNavigation();
  setupFilters();
  setupHeroActions();
  setupFloatingBar();
  await loadGallery();
  setupInfiniteScroll();
});

// 检查登录状态
async function checkAuth() {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      updateNavUI(true);
    } else {
      currentUser = null;
      updateNavUI(false);
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    currentUser = null;
    updateNavUI(false);
  }
}

// 更新导航栏 UI
function updateNavUI(isLoggedIn) {
  const navUser = document.getElementById('navUser');
  const navGuest = document.getElementById('navGuest');
  const navProfile = document.getElementById('navProfile');
  const navUsername = document.getElementById('navUsername');

  if (isLoggedIn && currentUser) {
    navUser.style.display = 'flex';
    navGuest.style.display = 'none';
    navProfile.style.display = 'block';
    navUsername.textContent = currentUser.username;
  } else {
    navUser.style.display = 'none';
    navGuest.style.display = 'flex';
    navProfile.style.display = 'none';
  }
}

// 设置导航事件
function setupNavigation() {
  const navLogout = document.getElementById('navLogout');
  const navLogin = document.getElementById('navLogin');
  const navRegister = document.getElementById('navRegister');

  if (navLogout) {
    navLogout.addEventListener('click', async () => {
      try {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        currentUser = null;
        updateNavUI(false);
        window.location.reload();
      } catch (err) {
        console.error('Logout failed:', err);
      }
    });
  }

  if (navLogin) {
    navLogin.addEventListener('click', () => {
      // 可以跳转到登录页面或显示登录弹窗
      // 这里简单处理，跳转到生图页面（那里有登录功能）
      window.location.href = '/generate.html';
    });
  }

  if (navRegister) {
    navRegister.addEventListener('click', () => {
      window.location.href = '/generate.html';
    });
  }
}

// 设置过滤器按钮
function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 更新按钮状态
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 更新过滤条件
      currentFilter = btn.dataset.filter;

      // 重新加载画廊
      currentOffset = 0;
      hasMore = true;
      document.getElementById('galleryGrid').innerHTML = '';
      loadGallery();
    });
  });
}

// 设置 Hero 区域按钮
function setupHeroActions() {
  const heroExplore = document.getElementById('heroExplore');

  if (heroExplore) {
    heroExplore.addEventListener('click', () => {
      // 平滑滚动到画廊区域
      const gallery = document.querySelector('.gallery-container');
      if (gallery) {
        gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// 加载画廊图片
async function loadGallery() {
  if (isLoading || !hasMore) return;

  isLoading = true;
  showLoading(true);
  hideEmpty();

  try {
    const featured = currentFilter === 'featured' ? '1' : '0';
    const url = `/api/gallery?limit=${LIMIT}&offset=${currentOffset}&featured=${featured}`;

    const res = await fetch(url, { credentials: 'include' });

    if (!res.ok) {
      throw new Error('Failed to load gallery');
    }

    const data = await res.json();
    const { gallery } = data;

    if (gallery && gallery.length > 0) {
      renderGalleryItems(gallery);
      currentOffset += gallery.length;

      if (gallery.length < LIMIT) {
        hasMore = false;
      }
    } else {
      if (currentOffset === 0) {
        showEmpty();
      }
      hasMore = false;
    }
  } catch (err) {
    console.error('Load gallery error:', err);
    if (currentOffset === 0) {
      showEmpty();
    }
  } finally {
    isLoading = false;
    showLoading(false);
  }
}

// 渲染画廊项
function renderGalleryItems(items) {
  const grid = document.getElementById('galleryGrid');

  items.forEach(item => {
    const card = createGalleryCard(item);
    grid.appendChild(card);
  });
}

// 创建画廊卡片
function createGalleryCard(item) {
  const card = document.createElement('div');
  card.className = 'gallery-item';

  const userInitial = (item.username || '管理员').charAt(0).toUpperCase();

  card.innerHTML = `
    <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.prompt || '图片')}" loading="lazy" />
    <div class="gallery-item-info">
      <div class="item-user">
        <div class="item-avatar">${userInitial}</div>
        <span class="item-username">${escapeHtml(item.username || '管理员')}</span>
      </div>
      <!--<div class="item-prompt">${escapeHtml(item.prompt || '')}</div>-->
      <div class="item-footer">
        <div class="item-likes">
          <span>♥</span>
          <span>${item.likes || 0}</span>
        </div>
        ${item.isFeatured ? '<span class="item-featured">精选</span>' : ''}
      </div>
    </div>
  `;

  // 点击打开详情
  card.addEventListener('click', () => {
    showImageModal(item);
  });

  return card;
}

// 显示图片详情模态框
function showImageModal(item) {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalUsername = document.getElementById('modalUsername');
  const modalUserInitial = document.getElementById('modalUserInitial');
  const modalTime = document.getElementById('modalTime');
  const modalPrompt = document.getElementById('modalPrompt');
  const modalDescription = document.getElementById('modalDescription');
  const modalDescriptionSection = document.getElementById('modalDescriptionSection');
  const modalTags = document.getElementById('modalTags');
  const modalTagsSection = document.getElementById('modalTagsSection');
  const modalLikes = document.getElementById('modalLikes');
  const modalDownload = document.getElementById('modalDownload');

  // 设置图片和基本信息
  modalImage.src = item.imageUrl;
  modalImage.alt = item.prompt || '图片';

  const username = item.username || '管理员';
  modalUsername.textContent = username;
  modalUserInitial.textContent = username.charAt(0).toUpperCase();

  modalTime.textContent = formatTime(item.createdAt);
  modalPrompt.textContent = item.prompt || '-';
  modalLikes.textContent = item.likes || 0;

  // 描述
  if (item.description && item.description.trim()) {
    modalDescription.textContent = item.description;
    modalDescriptionSection.hidden = false;
  } else {
    modalDescriptionSection.hidden = true;
  }

  // 标签
  if (item.tags && item.tags.length > 0) {
    modalTags.innerHTML = item.tags.map(tag =>
      `<span class="tag">${escapeHtml(tag)}</span>`
    ).join('');
    modalTagsSection.hidden = false;
  } else {
    modalTagsSection.hidden = true;
  }

  // 下载链接
  modalDownload.href = item.imageUrl;
  modalDownload.download = `image-${item.id}.jpg`;

  // 点赞按钮
  const modalLikeBtn = document.getElementById('modalLike');
  modalLikeBtn.onclick = () => handleLike(item.id);

  // 显示模态框
  modal.hidden = false;

  // 设置关闭事件
  setupModalClose();
}

// 处理点赞
async function handleLike(imageId) {
  try {
    const res = await fetch('/api/gallery/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ imageId })
    });

    if (res.ok) {
      const modalLikes = document.getElementById('modalLikes');
      const currentLikes = parseInt(modalLikes.textContent) || 0;
      modalLikes.textContent = currentLikes + 1;

      // 更新画廊中的显示
      const galleryItems = document.querySelectorAll('.gallery-item');
      galleryItems.forEach(item => {
        const likesSpan = item.querySelector('.item-likes span:last-child');
        if (likesSpan) {
          // 简单方案：重新加载整个画廊
          // 这里暂时只更新模态框中的数字
        }
      });
    }
  } catch (err) {
    console.error('Like error:', err);
  }
}

// 设置模态框关闭
function setupModalClose() {
  const modal = document.getElementById('imageModal');
  const closeBtns = modal.querySelectorAll('[data-close-modal]');

  closeBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      modal.hidden = true;
    };
  });

  // ESC 键关闭
  const escHandler = (e) => {
    if (e.key === 'Escape' && !modal.hidden) {
      modal.hidden = true;
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// 设置无限滚动
function setupInfiniteScroll() {
  let scrollTimeout;

  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;

      // 当滚动到距离底部 500px 时加载更多
      if (scrollPosition >= pageHeight - 500 && !isLoading && hasMore) {
        loadGallery();
      }
    }, 100);
  });
}

// 显示/隐藏加载状态
function showLoading(show) {
  const loading = document.getElementById('galleryLoading');
  if (loading) {
    loading.hidden = !show;
  }
}

// 显示空状态
function showEmpty() {
  const empty = document.getElementById('galleryEmpty');
  if (empty) {
    empty.hidden = false;
  }
}

// 隐藏空状态
function hideEmpty() {
  const empty = document.getElementById('galleryEmpty');
  if (empty) {
    empty.hidden = true;
  }
}

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // 秒

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 设置底部悬浮栏
function setupFloatingBar() {
  const floatingBar = document.getElementById('floatingActionBar');

  if (!floatingBar) return;

  // 滚动检测
  let lastScrollY = window.scrollY;
  let scrollTimeout;

  function handleScroll() {
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      const currentScrollY = window.scrollY;
      const heroHeight = document.querySelector('.hero')?.offsetHeight || 600;

      // 向下滚动超过 hero 区域时显示
      if (currentScrollY > heroHeight) {
        floatingBar.classList.add('visible');
      }
      // 接近顶部时隐藏
      else if (currentScrollY < heroHeight / 3) {
        floatingBar.classList.remove('visible');
      }

      lastScrollY = currentScrollY;
    }, 100);
  }

  window.addEventListener('scroll', handleScroll);
}
