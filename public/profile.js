(function () {
  'use strict';

  let currentUser = null;
  let currentTab = 'history';
  let historyOffset = 0;
  let favoritesOffset = 0;
  let historyHasMore = true;
  let favoritesHasMore = true;
  let isLoadingHistory = false;
  let isLoadingFavorites = false;
  const pageLimit = 20;

  // Elements
  const navUser = document.getElementById('navUser');
  const navGuest = document.getElementById('navGuest');
  const navUsername = document.getElementById('navUsername');
  const navLogout = document.getElementById('navLogout');
  const tabHistory = document.getElementById('tabHistory');
  const tabFavorites = document.getElementById('tabFavorites');
  const historyPanel = document.getElementById('historyPanel');
  const favoritesPanel = document.getElementById('favoritesPanel');
  const historyList = document.getElementById('historyList');
  const historyLoading = document.getElementById('historyLoading');
  const historyEmpty = document.getElementById('historyEmpty');
  const historyError = document.getElementById('historyError');
  const favoritesList = document.getElementById('favoritesList');
  const favoritesLoading = document.getElementById('favoritesLoading');
  const favoritesEmpty = document.getElementById('favoritesEmpty');
  const favoritesError = document.getElementById('favoritesError');
  const imageModal = document.getElementById('imageModal');
  const imageModalImg = document.getElementById('imageModalImg');
  const zoomRange = document.getElementById('zoomRange');
  const zoomValue = document.getElementById('zoomValue');
  const quotaMonth = document.getElementById('quotaMonth');
  const quotaTotal = document.getElementById('quotaTotal');
  const quotaUsed = document.getElementById('quotaUsed');
  const quotaRemaining = document.getElementById('quotaRemaining');
  const quotaProgressBar = document.getElementById('quotaProgressBar');

  // Check authentication
  async function checkAuth() {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (!data.user) {
        window.location.href = '/';
        return false;
      }
      currentUser = data.user;

      // 更新导航栏
      if (navUsername) navUsername.textContent = data.user.username;
      if (navUser) navUser.style.display = 'flex';
      if (navGuest) navGuest.style.display = 'none';

      return true;
    } catch (err) {
      console.error('Failed to check auth:', err);
      window.location.href = '/';
      return false;
    }
  }

  // Logout
  async function logout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  }

  // Load quota info
  async function loadQuota() {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) throw new Error('Failed to load quota');

      const data = await res.json();
      if (!data.user || !data.quota) return;

      const quota = data.quota;
      const total = quota.limit || 0;
      const used = quota.used || 0;
      const remaining = quota.remaining || 0;
      const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;

      // Update current month
      const monthStr = quota.month || '';
      if (quotaMonth) quotaMonth.textContent = monthStr;

      // Update values
      if (quotaTotal) quotaTotal.textContent = total;
      if (quotaUsed) quotaUsed.textContent = used;
      if (quotaRemaining) quotaRemaining.textContent = remaining;

      // Update progress bar
      if (quotaProgressBar) {
        quotaProgressBar.style.width = `${percentage}%`;

        // Change color based on usage
        if (percentage >= 90) {
          quotaProgressBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
          quotaProgressBar.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
        } else if (percentage >= 70) {
          quotaProgressBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
          quotaProgressBar.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.5)';
        } else {
          quotaProgressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
          quotaProgressBar.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
        }
      }
    } catch (err) {
      console.error('Failed to load quota:', err);
      if (quotaTotal) quotaTotal.textContent = '加载失败';
      if (quotaUsed) quotaUsed.textContent = '-';
      if (quotaRemaining) quotaRemaining.textContent = '-';
    }
  }

  // Tab switching
  function switchTab(tab) {
    currentTab = tab;
    const tabs = [tabHistory, tabFavorites];
    const panels = [historyPanel, favoritesPanel];

    tabs.forEach((btn) => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    panels.forEach((panel) => {
      if (panel.id === `${tab}Panel`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (tab === 'history' && historyList.children.length === 0) {
      loadHistory();
    } else if (tab === 'favorites' && favoritesList.children.length === 0) {
      loadFavorites();
    }
  }

  // Load history
  async function loadHistory() {
    if (isLoadingHistory || !historyHasMore) return;
    isLoadingHistory = true;
    historyLoading.hidden = false;
    historyError.hidden = true;

    try {
      const res = await fetch(`/api/history?limit=${pageLimit}&offset=${historyOffset}`);
      if (!res.ok) throw new Error('Failed to load history');

      const data = await res.json();
      const items = data.history || [];

      if (items.length === 0) {
        historyHasMore = false;
        if (historyOffset === 0) {
          historyEmpty.hidden = false;
        }
      } else {
        items.forEach((item) => renderHistoryItem(item));
        historyOffset += items.length;
        if (items.length < pageLimit) {
          historyHasMore = false;
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      historyError.textContent = '加载历史记录失败';
      historyError.hidden = false;
    } finally {
      isLoadingHistory = false;
      historyLoading.hidden = true;
    }
  }

  // Render history item
  function renderHistoryItem(item) {
    const card = document.createElement('div');
    card.className = 'history-card';

    const header = document.createElement('div');
    header.className = 'history-header';

    const prompt = document.createElement('div');
    prompt.className = 'history-prompt';
    prompt.textContent = item.prompt;

    const meta = document.createElement('div');
    meta.className = 'history-meta';

    const badge = document.createElement('span');
    badge.className = 'history-badge';
    badge.textContent = item.mode === 'txt2img' ? 'TXT2IMG' : 'IMG2IMG';

    const time = document.createElement('span');
    time.textContent = formatTime(item.createdAt);

    meta.appendChild(badge);
    meta.appendChild(time);
    header.appendChild(prompt);
    header.appendChild(meta);

    const images = document.createElement('div');
    images.className = 'history-images';

    (item.outputImageUrls || []).forEach((url) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'history-image';

      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Generated image';
      img.loading = 'lazy';
      img.addEventListener('click', () => openImageModal(url));

      const overlay = document.createElement('div');
      overlay.className = 'history-image-overlay';

      const favoriteBtn = document.createElement('button');
      favoriteBtn.className = 'favorite-btn';
      favoriteBtn.textContent = '★ 收藏';
      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addFavorite(item.id, url, favoriteBtn);
      });

      const shareBtn = document.createElement('button');
      shareBtn.className = 'share-btn';
      shareBtn.textContent = '分享';
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareToGallery(item.id, url, shareBtn);
      });

      overlay.appendChild(favoriteBtn);
      overlay.appendChild(shareBtn);
      imgWrapper.appendChild(img);
      imgWrapper.appendChild(overlay);
      images.appendChild(imgWrapper);
    });

    card.appendChild(header);
    card.appendChild(images);
    historyList.appendChild(card);
  }

  // Load favorites
  async function loadFavorites() {
    if (isLoadingFavorites || !favoritesHasMore) return;
    isLoadingFavorites = true;
    favoritesLoading.hidden = false;
    favoritesError.hidden = true;

    try {
      const res = await fetch(`/api/favorites?limit=${pageLimit}&offset=${favoritesOffset}`);
      if (!res.ok) throw new Error('Failed to load favorites');

      const data = await res.json();
      const items = data.favorites || [];

      if (items.length === 0) {
        favoritesHasMore = false;
        if (favoritesOffset === 0) {
          favoritesEmpty.hidden = false;
        }
      } else {
        items.forEach((item) => renderFavoriteItem(item));
        favoritesOffset += items.length;
        if (items.length < pageLimit) {
          favoritesHasMore = false;
        }
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
      favoritesError.textContent = '加载收藏失败';
      favoritesError.hidden = false;
    } finally {
      isLoadingFavorites = false;
      favoritesLoading.hidden = true;
    }
  }

  // Render favorite item
  function renderFavoriteItem(item) {
    const card = document.createElement('div');
    card.className = 'favorite-card';
    card.dataset.favoriteId = item.id;

    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = 'Favorite image';
    img.loading = 'lazy';
    img.addEventListener('click', () => openImageModal(item.imageUrl));

    const overlay = document.createElement('div');
    overlay.className = 'favorite-card-overlay';

    if (item.history && item.history.prompt) {
      const promptDiv = document.createElement('div');
      promptDiv.className = 'favorite-prompt';
      promptDiv.textContent = item.history.prompt;
      overlay.appendChild(promptDiv);
    }

    const actions = document.createElement('div');
    actions.className = 'favorite-actions';

    const shareBtn = document.createElement('button');
    shareBtn.className = 'share-btn-fav';
    shareBtn.textContent = '分享';
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (item.historyId) {
        shareToGallery(item.historyId, item.imageUrl, shareBtn);
      }
    });

    const unfavoriteBtn = document.createElement('button');
    unfavoriteBtn.className = 'unfavorite-btn';
    unfavoriteBtn.textContent = '取消收藏';
    unfavoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(item.id, card);
    });

    actions.appendChild(shareBtn);
    actions.appendChild(unfavoriteBtn);
    overlay.appendChild(actions);
    card.appendChild(img);
    card.appendChild(overlay);
    favoritesList.appendChild(card);
  }

  // Add favorite
  async function addFavorite(historyId, imageUrl, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '收藏中...';

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId, imageUrl }),
      });

      if (res.ok) {
        btn.textContent = '✓ 已收藏';
        btn.classList.add('favorited');
      } else {
        const data = await res.json();
        if (res.status === 409) {
          btn.textContent = '✓ 已收藏';
          btn.classList.add('favorited');
        } else {
          throw new Error(data.error || 'Failed to add favorite');
        }
      }
    } catch (err) {
      console.error('Failed to add favorite:', err);
      btn.textContent = originalText;
      btn.disabled = false;
      alert('收藏失败: ' + err.message);
    }
  }

  // Remove favorite
  async function removeFavorite(favoriteId, card) {
    if (!confirm('确定要取消收藏吗？')) return;

    try {
      const res = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: favoriteId }),
      });

      if (res.ok) {
        card.remove();
        if (favoritesList.children.length === 0) {
          favoritesEmpty.hidden = false;
        }
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove favorite');
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      alert('取消收藏失败: ' + err.message);
    }
  }

  // Share to gallery
  async function shareToGallery(historyId, imageUrl, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '分享中...';

    try {
      const res = await fetch('/api/gallery/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId, imageUrl }),
      });

      if (res.ok) {
        btn.textContent = '✓ 已分享';
        btn.classList.add('shared');
      } else {
        const data = await res.json();
        if (res.status === 409) {
          btn.textContent = '✓ 已分享';
          btn.classList.add('shared');
        } else {
          throw new Error(data.error || '分享失败');
        }
      }
    } catch (err) {
      console.error('Failed to share to gallery:', err);
      btn.textContent = originalText;
      btn.disabled = false;
      alert('分享失败: ' + err.message);
    }
  }

  // Image modal
  function openImageModal(url) {
    imageModalImg.src = url;
    imageModalImg.style.transform = 'scale(1)';
    zoomRange.value = '100';
    zoomValue.textContent = '100%';
    imageModal.hidden = false;
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.hidden = true;
  }

  // Format time
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return '刚刚';
  }

  // Infinite scroll
  function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        if (currentTab === 'history') {
          loadHistory();
        } else if (currentTab === 'favorites') {
          loadFavorites();
        }
      }
    });
  }

  // Event listeners
  if (navLogout) {
    navLogout.addEventListener('click', logout);
  }
  tabHistory.addEventListener('click', () => switchTab('history'));
  tabFavorites.addEventListener('click', () => switchTab('favorites'));

  // Modal close
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.closeModal;
      closeModal(modalId);
    });
  });

  // Image zoom
  zoomRange.addEventListener('input', (e) => {
    const scale = e.target.value / 100;
    imageModalImg.style.transform = `scale(${scale})`;
    zoomValue.textContent = `${e.target.value}%`;
  });

  // Modal backdrop close
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      closeModal('imageModal');
    }
  });

  // Initialize
  async function init() {
    const isAuthed = await checkAuth();
    if (isAuthed) {
      loadQuota();
      setupInfiniteScroll();
      loadHistory();
    }
  }

  init();
})();
