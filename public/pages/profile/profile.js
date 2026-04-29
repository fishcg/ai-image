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

      // 检查用户是否被禁用
      if (data.user.isDisabled) {
        showDisabledWarning();
      }

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

    // Get original image URL from input images if available
    const originalSrc = (item.inputImageUrls && item.inputImageUrls.length > 0) ? item.inputImageUrls[0] : '';

    (item.outputImageUrls || []).forEach((url) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'history-image';

      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Generated image';
      img.loading = 'lazy';
      img.dataset.originalSrc = originalSrc;
      img.addEventListener('click', () => openImageModal(url, originalSrc));

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

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = '继续编辑';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(`/pages/generate/generate.html?editImage=${encodeURIComponent(url)}`, '_blank');
      });

      overlay.appendChild(favoriteBtn);
      overlay.appendChild(shareBtn);
      overlay.appendChild(editBtn);
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

    // Get original image URL from history if available
    const originalSrc = item.history?.inputImageUrls?.[0] || '';

    // Add click event to card for opening modal
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking on buttons
      if (e.target.tagName === 'BUTTON') return;
      openImageModal(item.imageUrl, originalSrc);
    });

    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = 'Favorite image';
    img.loading = 'lazy';

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

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn-fav';
    editBtn.textContent = '继续编辑';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(`/pages/generate/generate.html?editImage=${encodeURIComponent(item.imageUrl)}`, '_blank');
    });

    actions.appendChild(shareBtn);
    actions.appendChild(editBtn);
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

  // Image modal - gallery state
  let modalGallery = null; // { items: [{src, originalSrc}], index }

  function collectGalleryFromHistory() {
    const items = [];
    const imgs = historyList.querySelectorAll('.history-image img');
    imgs.forEach((img) => {
      items.push({
        src: img.src,
        originalSrc: img.dataset?.originalSrc || '',
      });
    });
    return items;
  }

  function collectGalleryFromFavorites() {
    const items = [];
    const imgs = favoritesList.querySelectorAll('.favorites-image img');
    imgs.forEach((img) => {
      items.push({
        src: img.src,
        originalSrc: '',
      });
    });
    return items;
  }

  function openImageModal(url, originalSrc = '') {
    // Build gallery from current tab
    const items = currentTab === 'history' ? collectGalleryFromHistory() : collectGalleryFromFavorites();
    const index = items.findIndex(item => item.src === url);
    modalGallery = { items, index: Math.max(0, index) };

    showGalleryImage(modalGallery.index);
    imageModal.hidden = false;
    syncNavButtons();
  }

  function showGalleryImage(index) {
    if (!modalGallery || index < 0 || index >= modalGallery.items.length) return;
    modalGallery.index = index;

    const item = modalGallery.items[index];
    const imgOriginal = document.getElementById('imageModalImgOriginal');
    const compareWrapper = document.getElementById('compareSliderWrapper');
    const compareSliderLine = document.getElementById('compareSliderLine');
    const compareRangeEl = document.getElementById('compareRange');
    const toggleBtn = document.getElementById('toggleOriginal');

    imageModalImg.src = item.src;
    imageModalImg.style.transform = 'scale(1)';
    zoomRange.value = '100';
    zoomValue.textContent = '100%';

    const hasOriginal = Boolean(item.originalSrc) && item.originalSrc !== item.src;

    if (toggleBtn) toggleBtn.hidden = !hasOriginal;

    if (hasOriginal && imgOriginal && compareWrapper && compareSliderLine) {
      imgOriginal.src = item.originalSrc;
      imgOriginal.style.transform = 'scale(1)';
      if (compareRangeEl) compareRangeEl.value = '0';
      imageModalImg.style.clipPath = 'inset(0 0 0 0%)';
      compareSliderLine.style.left = '0%';
      compareSliderLine.style.display = 'block';

      const updateSliderWidth = () => {
        const container = imageModalImg.closest('.image-compare-container');
        if (container) {
          compareWrapper.style.width = `${container.offsetWidth}px`;
          compareWrapper.hidden = false;
        }
      };
      if (imageModalImg.complete) setTimeout(updateSliderWidth, 0);
      else imageModalImg.addEventListener('load', updateSliderWidth, { once: true });
    } else if (compareWrapper && compareSliderLine && imgOriginal) {
      compareWrapper.hidden = true;
      compareSliderLine.style.display = 'none';
      imgOriginal.src = '';
      imageModalImg.style.clipPath = '';
    }

    syncNavButtons();
  }

  function syncNavButtons() {
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    if (!modalGallery || modalGallery.items.length <= 1) {
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      return;
    }
    if (prevBtn) { prevBtn.hidden = false; prevBtn.disabled = modalGallery.index <= 0; }
    if (nextBtn) { nextBtn.hidden = false; nextBtn.disabled = modalGallery.index >= modalGallery.items.length - 1; }
  }

  function toggleFullscreen() {
    const modalCard = document.querySelector('#imageModal .imageModalCard');
    if (!modalCard) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      modalCard.requestFullscreen().catch(() => {});
    }
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
    const imgOriginal = document.getElementById('imageModalImgOriginal');
    if (imgOriginal && imgOriginal.src) {
      imgOriginal.style.transform = `scale(${scale})`;
    }
    zoomValue.textContent = `${e.target.value}%`;
  });

  // Image comparison slider
  const compareRange = document.getElementById('compareRange');
  if (compareRange) {
    compareRange.addEventListener('input', (e) => {
      const value = Number(e.target.value);
      const percent = isNaN(value) ? 0 : value;
      updateImageComparison(percent);
    });
  }

  // Update image comparison position
  function updateImageComparison(percentage) {
    const img = document.getElementById('imageModalImg');
    const sliderLine = document.getElementById('compareSliderLine');
    if (!img) return;

    // Handle 0 correctly - don't use || because 0 is falsy
    const value = Number(percentage);
    const percent = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));

    // Update clip-path to show percentage of new image from right
    img.style.clipPath = `inset(0 0 0 ${percent}%)`;

    // Update slider line position
    if (sliderLine) {
      sliderLine.style.left = `${percent}%`;
    }
  }

  // Modal backdrop close
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      closeModal('imageModal');
    }
  });

  // Navigation buttons
  document.getElementById('prevImage')?.addEventListener('click', () => {
    if (modalGallery) showGalleryImage(modalGallery.index - 1);
  });
  document.getElementById('nextImage')?.addEventListener('click', () => {
    if (modalGallery) showGalleryImage(modalGallery.index + 1);
  });

  // Fullscreen button
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', () => {
      const isFs = Boolean(document.fullscreenElement);
      fullscreenBtn.textContent = isFs ? '退出全屏' : '全屏';
      const modalCard = document.querySelector('#imageModal .imageModalCard');
      if (modalCard) modalCard.classList.toggle('fullscreen-mode', isFs);
    });
  }

  // Toggle original button
  document.getElementById('toggleOriginal')?.addEventListener('click', () => {
    const btn = document.getElementById('toggleOriginal');
    const imgOriginal = document.getElementById('imageModalImgOriginal');
    const compareWrapper = document.getElementById('compareSliderWrapper');
    if (!btn || !imgOriginal) return;
    const showing = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', String(!showing));
    btn.textContent = showing ? '显示原图' : '显示新图';
    imgOriginal.style.zIndex = showing ? '1' : '3';
    if (compareWrapper) compareWrapper.hidden = !showing;
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (imageModal.hidden) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (modalGallery) showGalleryImage(modalGallery.index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (modalGallery) showGalleryImage(modalGallery.index + 1);
    } else if (e.key === 'Escape') {
      if (document.fullscreenElement) document.exitFullscreen();
      else closeModal('imageModal');
    } else if ((e.key === 'f' || e.key === 'F') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // Show disabled warning
  function showDisabledWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'disabledWarning';
    warningDiv.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      padding: 16px 24px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      z-index: 10000;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      max-width: 90%;
      animation: slideDown 0.3s ease-out;
    `;
    warningDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">⚠️</span>
        <div>
          <div>您的账号已被禁用</div>
          <div style="font-size: 14px; font-weight: 400; margin-top: 4px; opacity: 0.9;">
            无法生成或修改图片，如有疑问请联系管理员
          </div>
        </div>
      </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          transform: translateX(-50%) translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(warningDiv);
  }

  // ========== API Key Management ==========
  async function loadApiKey() {
    try {
      const res = await fetch('/api/apikey');
      if (!res.ok) return;
      const data = await res.json();
      const emptyEl = document.getElementById('apikeyEmpty');
      const infoEl = document.getElementById('apikeyInfo');
      if (!data.apiKey) {
        if (emptyEl) emptyEl.style.display = '';
        if (infoEl) infoEl.style.display = 'none';
        return;
      }
      if (emptyEl) emptyEl.style.display = 'none';
      if (infoEl) infoEl.style.display = '';
      const prefix = document.getElementById('apikeyPrefix');
      const created = document.getElementById('apikeyCreated');
      const lastUsed = document.getElementById('apikeyLastUsed');
      if (prefix) prefix.textContent = data.apiKey.api_key;
      if (created) created.textContent = '创建于 ' + new Date(data.apiKey.created_at).toLocaleString('zh-CN');
      if (lastUsed) lastUsed.textContent = data.apiKey.last_used_at ? '最后使用 ' + new Date(data.apiKey.last_used_at).toLocaleString('zh-CN') : '未使用过';
    } catch (err) {
      console.error('Failed to load API key:', err);
    }
  }

  function initApiKey() {
    const createBtn = document.getElementById('createApiKeyBtn');
    const deleteBtn = document.getElementById('deleteApiKeyBtn');
    const modal = document.getElementById('apikeyModal');
    const modalClose = document.getElementById('apikeyModalClose');
    const modalOk = document.getElementById('apikeyModalOk');
    const copyBtn = document.getElementById('copyApiKeyBtn');

    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        createBtn.disabled = true;
        createBtn.textContent = '创建中...';
        try {
          const res = await fetch('/api/apikey', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) { alert(data.error || '创建失败'); return; }
          document.getElementById('apikeyFull').textContent = data.apiKey;
          if (modal) modal.hidden = false;
          loadApiKey();
        } catch (err) {
          alert('创建失败: ' + err.message);
        } finally {
          createBtn.disabled = false;
          createBtn.textContent = '创建 API Key';
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('确定要删除 API Key 吗？删除后使用该 Key 的所有调用将失效。')) return;
        deleteBtn.disabled = true;
        try {
          const res = await fetch('/api/apikey', { method: 'DELETE' });
          if (!res.ok) { const d = await res.json(); alert(d.error || '删除失败'); return; }
          loadApiKey();
        } catch (err) {
          alert('删除失败: ' + err.message);
        } finally {
          deleteBtn.disabled = false;
        }
      });
    }

    function closeModal() { if (modal) modal.hidden = true; }
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOk) modalOk.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const key = document.getElementById('apikeyFull')?.textContent;
        if (!key) return;
        navigator.clipboard.writeText(key).then(() => {
          copyBtn.textContent = '已复制';
          setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
        }).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = key;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.textContent = '已复制';
          setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
        });
      });
    }

    // 复制 key（info 行内图标）
    const copyInline = document.getElementById('copyApiKeyInline');
    if (copyInline) {
      copyInline.addEventListener('click', () => {
        const key = document.getElementById('apikeyPrefix')?.textContent;
        if (!key) return;
        navigator.clipboard.writeText(key).then(() => {
          showCopyTip(copyInline);
        }).catch(() => {});
      });
    }

    function showCopyTip(anchor) {
      const tip = document.createElement('span');
      tip.textContent = '已复制';
      tip.style.cssText = 'position:absolute;padding:4px 10px;background:rgba(16,185,129,0.9);color:#fff;font-size:12px;border-radius:4px;white-space:nowrap;pointer-events:none;z-index:100;transform:translateY(-120%);';
      anchor.style.position = 'relative';
      anchor.appendChild(tip);
      setTimeout(() => tip.remove(), 1000);
    }

    // 使用说明弹窗
    const helpBtn = document.getElementById('apikeyHelpBtn');
    const helpModal = document.getElementById('apikeyHelpModal');
    const helpClose = document.getElementById('apikeyHelpClose');
    const helpOk = document.getElementById('apikeyHelpOk');

    function closeHelp() { if (helpModal) helpModal.hidden = true; }
    if (helpBtn) helpBtn.addEventListener('click', () => { if (helpModal) helpModal.hidden = false; });
    if (helpClose) helpClose.addEventListener('click', closeHelp);
    if (helpOk) helpOk.addEventListener('click', closeHelp);
    if (helpModal) helpModal.addEventListener('click', (e) => { if (e.target === helpModal) closeHelp(); });
  }

  // Initialize
  async function init() {
    const isAuthed = await checkAuth();
    if (isAuthed) {
      loadQuota();
      loadApiKey();
      initApiKey();
      setupInfiniteScroll();
      loadHistory();
    }
  }

  init();
})();
