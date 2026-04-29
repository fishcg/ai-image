// 用户详情页面逻辑
const urlParams = new URLSearchParams(window.location.search);
const userId = Number(urlParams.get('id'));

let currentPage = 1;
let totalPages = 1;

if (!userId || userId <= 0) {
  alert('无效的用户 ID');
  window.location.href = '/pages/admin/users.html';
}

async function loadUserInfo() {
  try {
    const response = await fetch(`/api/admin/users/detail?id=${userId}`);
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/pages/admin/login.html';
        return;
      }
      throw new Error('Failed to load user info');
    }

    const data = await response.json();
    const user = data.user;

    document.getElementById('pageTitle').textContent = `用户详情 - ${user.username}`;
    document.getElementById('userId').textContent = user.id;
    document.getElementById('username').textContent = user.username;
    document.getElementById('userStatus').innerHTML = user.is_disabled
      ? '<span class="badge badge-danger">已禁用</span>'
      : '<span class="badge badge-success">正常</span>';
    document.getElementById('userLimit').textContent = user.custom_monthly_limit !== null
      ? user.custom_monthly_limit
      : '使用默认值';
    document.getElementById('generationCount').textContent = data.generationCount;
    document.getElementById('createdAt').textContent = formatDate(user.created_at);
  } catch (error) {
    console.error('Failed to load user info:', error);
    showToast('加载用户信息失败', 'error');
  }
}

async function loadGenerations() {
  try {
    const response = await fetch(`/api/admin/users/generations?userId=${userId}&page=${currentPage}&limit=20`);
    if (!response.ok) {
      throw new Error('Failed to load generations');
    }

    const data = await response.json();
    renderGenerations(data.generations);
    updatePagination(data.pagination);
  } catch (error) {
    console.error('Failed to load generations:', error);
    document.getElementById('generationsContainer').innerHTML =
      '<div style="text-align: center; padding: 40px; color: #ef4444;">加载失败</div>';
  }
}

function renderGenerations(generations) {
  const container = document.getElementById('generationsContainer');

  if (generations.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">暂无生成记录</div>';
    return;
  }

  container.innerHTML = `
    <div class="generation-list">
      ${generations.map(gen => {
        const parseUrls = (field) => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') { try { return JSON.parse(field); } catch { return []; } }
          return [];
        };
        const inputUrls = parseUrls(gen.input_image_urls);
        const outputUrls = parseUrls(gen.output_image_urls);
        const modelNames = {
          'dashscope': '快速修图',
          'google-nano-banana-pro': 'Google Nano',
          'jimeng': '即梦4.0',
          'gpt-image': 'GPT Image'
        };
        const modeNames = {
          'img2img': '修图',
          'txt2img': '生图'
        };
        const hasInput = inputUrls.length > 0;

        return `
          <div class="generation-card">
            <div class="generation-row${hasInput ? '' : ' no-input'}">
              ${hasInput ? `
              <div class="generation-col generation-col-input">
                <div class="col-label">原图</div>
                <div class="generation-images">
                  ${inputUrls.map(url => `
                    <img src="${escapeHtml(url)}" class="generation-image" onclick="showImage('${escapeHtml(url)}')" alt="原图" />
                  `).join('')}
                </div>
              </div>
              <div class="generation-arrow">→</div>
              ` : ''}
              <div class="generation-col generation-col-output">
                ${hasInput ? '<div class="col-label">生成结果</div>' : ''}
                <div class="generation-images">
                  ${outputUrls.map(url => `
                    <img src="${escapeHtml(url)}" class="generation-image" onclick="showImage('${escapeHtml(url)}')" alt="生成图片" />
                  `).join('')}
                </div>
              </div>
            </div>
            <div class="generation-info">
              <span class="badge badge-success">${modeNames[gen.mode] || gen.mode}</span>
              <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">
                ${modelNames[gen.model_id] || gen.model_id}
              </span>
              <span style="margin-left: 8px;">${formatDate(gen.created_at)}</span>
            </div>
            <div class="generation-prompt">${escapeHtml(gen.prompt)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function updatePagination(pagination) {
  currentPage = pagination.page;
  totalPages = pagination.totalPages;

  const paginationContainer = document.getElementById('paginationContainer');
  if (totalPages > 1) {
    paginationContainer.style.display = 'flex';
  } else {
    paginationContainer.style.display = 'none';
  }

  document.getElementById('pageInfo').textContent =
    `第 ${pagination.page} / ${pagination.totalPages} 页 (共 ${pagination.total} 条)`;

  document.getElementById('prevPage').disabled = currentPage <= 1;
  document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

function showImage(url) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImage');
  img.src = url;
  modal.classList.add('active');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 事件绑定
document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadGenerations();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    loadGenerations();
  }
});

document.getElementById('imageModal').addEventListener('click', () => {
  document.getElementById('imageModal').classList.remove('active');
});

// 初始化
AdminLayout.init({ activePage: 'users' });
loadUserInfo();
loadGenerations();
