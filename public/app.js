const presets = {
  '粒子效果':
    '加入细腻的粒子光点漂浮效果（bokeh/particle），体积光，梦幻氛围，粒子沿主体轮廓流动，高质量细节，电影感。',
  '头发飘逸':
    '头发自然飘逸，发丝清晰，微风动态感，柔顺高光，边缘细节干净，人物比例与脸部保持不变。',
  '闪电效果':
    '添加蓝紫色闪电能量特效，电弧缠绕主体与武器，强对比光影，动感冲击，电影级 VFX。',
  '烟雾效果':
    '增加层次丰富的烟雾/雾气（smoke/fog），半透明体积感，边缘柔和不过度遮挡主体，氛围更强但主体清晰。',
  '武器发光':
    '让武器发出高亮能量光（glow/emissive），发光边缘干净，带轻微光晕与溢光，保持材质细节与轮廓不变。',
  '火焰特效':
    '添加真实火焰特效（flame），火光照亮周围，颜色自然（橙黄/蓝焰可选），火焰与主体接触处细节丰富。',
  '能量光环':
    '在主体周围加入能量光环/护盾（energy aura/shield），半透明层次，微粒流动，边缘发光但不遮挡面部。',
  '霓虹光效':
    '加入霓虹灯光与边缘轮廓光（neon rim light），高对比色彩，环境反射自然，整体更赛博风但保持原始形体。',
  '电影调色':
    '进行电影级调色（cinematic color grading），提升对比与层次，皮肤/材质不过饱和，保留细节与动态范围。',
  '背景虚化':
    '增强背景景深虚化（bokeh），主体更突出，背景干净不杂乱，避免抠图边缘与重影。',
  '锐化细节':
    '提升清晰度与细节（sharpness/detail），纹理更清楚但避免过度锐化与噪点，边缘自然。',
  '去噪':
    '降低噪点与颗粒（denoise），平滑但不糊，保留关键细节与纹理。',
  '二次元柔光':
    '添加二次元风柔光（anime soft light），整体更通透，暗部提亮但不灰，肤色干净自然，保留五官与妆面细节。',
  '大眼高光':
    '加强眼睛高光与通透感（eye sparkle），虹膜更清晰，眼白干净不过曝，保持眼型不变避免夸张变形。',
  '漫画线稿':
    '加入轻微漫画线稿/描边效果（manga lineart），轮廓干净，线条细腻，不要破坏原始面部与服装细节。',
  '赛璐璐光影':
    '加入日漫赛璐璐风格光影（cel shading），明暗分区清晰但过渡自然，保持照片质感与细节。',
  '舞台灯光':
    '模拟漫展舞台灯光（stage lighting），彩色追光/背光，体积光与轻微光晕，氛围更强但主体曝光正确。',
  '樱花氛围':
    '加入樱花花瓣飘落与粉色氛围（sakura petals），景深虚化，自然散景，主体清晰，避免遮挡面部。',
  '星光闪粉':
    '加入星光与闪粉粒子（sparkle/glitter），点状高光分布自然，边缘不脏不糊，整体更梦幻。',
  '日系清透':
    '日系清透人像风格（japanese clean tone），低饱和、通透肤色、干净背景，减少杂色与噪点，质感自然。',
  '漫画网点':
    '加入轻微漫画网点/网屏质感（screentone/halftone），不要覆盖五官细节，整体更像漫画海报。',
  '速度线':
    '加入漫画速度线/动感线（speed lines），突出主体动作与冲击感，线条适度不抢主体。',
};

function $(id) {
  return document.getElementById(id);
}

let currentUser = null;
let currentQuota = null;

function setStatus(text, type = 'info') {
  const el = $('status');
  el.textContent = text || '';
  el.classList.toggle('error', type === 'error');
}

function openModal(id) {
  const el = $(id);
  if (!el) return;
  el.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = $(id);
  if (!el) return;
  el.hidden = true;
  document.body.style.overflow = '';
}

function setFormError(id, message) {
  const el = $(id);
  if (!el) return;
  const text = String(message || '').trim();
  el.textContent = text;
  el.hidden = !text;
}

function setAuthUi({ user, quota }) {
  currentUser = user || null;
  currentQuota = quota || null;

  for (const section of document.querySelectorAll('[data-auth="required"]')) {
    section.hidden = !currentUser;
  }

  const me = $('me');
  const quotaEl = $('quota');
  const openLoginBtn = $('openLogin');
  const openRegisterBtn = $('openRegister');
  const logoutBtn = $('logout');
  const submitBtn = $('submit');

  if (!currentUser) {
    me.textContent = '未登录';
    quotaEl.textContent = '';
    quotaEl.classList.remove('bad');
    openLoginBtn.style.display = '';
    openRegisterBtn.style.display = '';
    logoutBtn.style.display = 'none';
    submitBtn.disabled = true;
    $('preview').innerHTML = '';
    $('results').innerHTML = '';
    return;
  }

  me.textContent = currentUser.username;
  openLoginBtn.style.display = 'none';
  openRegisterBtn.style.display = 'none';
  logoutBtn.style.display = '';

  if (currentQuota) {
    quotaEl.textContent = `本月剩余：${currentQuota.remaining}/${currentQuota.limit}（${currentQuota.month}）`;
    quotaEl.classList.toggle('bad', currentQuota.remaining <= 0);
    submitBtn.disabled = currentQuota.remaining <= 0;
  } else {
    quotaEl.textContent = '';
    quotaEl.classList.remove('bad');
    submitBtn.disabled = false;
  }
}

async function refreshMe() {
  const resp = await fetch('/api/me', { method: 'GET' });
  const data = await resp.json().catch(() => ({}));
  setAuthUi({ user: data.user, quota: data.quota });
}

async function handleLogin() {
  setFormError('loginError', '');
  const username = $('loginUsername').value.trim();
  const password = $('loginPassword').value;
  const resp = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    setFormError('loginError', data?.error || '登录失败');
    return;
  }
  setAuthUi({ user: data.user, quota: data.quota });
  $('loginPassword').value = '';
  closeModal('loginModal');
}

async function handleRegister() {
  setFormError('registerError', '');
  const username = $('registerUsername').value.trim();
  const password = $('registerPassword').value;
  const inviteCode = $('inviteCode').value.trim();
  const resp = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, inviteCode }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    setFormError('registerError', data?.error || '注册失败');
    return;
  }
  $('registerPassword').value = '';
  closeModal('registerModal');
  $('loginUsername').value = username;
  $('loginPassword').value = '';
  openModal('loginModal');
}

async function handleLogout() {
  setFormError('loginError', '');
  setFormError('registerError', '');
  await fetch('/api/logout', { method: 'POST' }).catch(() => {});
  $('loginPassword').value = '';
  $('registerPassword').value = '';
  setAuthUi({ user: null, quota: null });
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function getFaceStrength() {
  const el = $('faceStrength');
  return clampInt(el ? el.value : 3, 1, 5, 3);
}

function buildFaceRedrawPrompt(strength) {
  const s = clampInt(strength, 1, 5, 3);
  const intensity = ['轻微', '较轻', '中等', '较强', '强'][s - 1];
  return [
    `面部重绘强度：${s}/5（${intensity}）`,
    '面部重绘，仅修改面部，对皮肤进行磨皮，修复斑点和凹凸不平，皮肤美白（注意脖子也需要美白），妆容更精致，去掉鼻贴和双眼皮贴',
    '(清晰的下颌线), (高挺的鼻梁), (深邃的眼神),鼻子变小，小脸, 五官更精致，精致的妆面细节, 漫展场照精修',
  ].join('\n');
}

function renderPreview(files) {
  const preview = $('preview');
  preview.innerHTML = '';
  if (!files || files.length === 0) return;

  for (const file of files) {
    const div = document.createElement('div');
    div.className = 'thumb';

    const img = document.createElement('img');
    img.alt = file.name;
    img.src = URL.createObjectURL(file);

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = file.name;

    div.appendChild(img);
    div.appendChild(name);
    preview.appendChild(div);
  }
}

function renderResults(urls) {
  const results = $('results');
  results.innerHTML = '';

  if (!urls || urls.length === 0) {
    results.innerHTML = '<div class="hint">暂无结果。</div>';
    return;
  }

  for (const url of urls) {
    const wrap = document.createElement('div');
    wrap.className = 'result';

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'output';

    const meta = document.createElement('div');
    meta.className = 'meta';

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.textContent = '打开原图';

    meta.appendChild(a);
    wrap.appendChild(img);
    wrap.appendChild(meta);
    results.appendChild(wrap);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function handleSubmit() {
  const files = Array.from($('images').files || []);
  if (files.length === 0) {
    setStatus('请先选择图片。', 'error');
    return;
  }
  if (files.length > 6) {
    setStatus('输入图片最多 6 张。', 'error');
    return;
  }

  let prompt = $('prompt').value.trim();
  if (!prompt) {
    setStatus('请填写 prompt。', 'error');
    return;
  }

  if ($('faceRedraw')?.checked) {
    const faceSnippet = buildFaceRedrawPrompt(getFaceStrength());
    prompt = `${prompt}\n${faceSnippet}`.trim();
  }

  const n = clampInt($('n').value, 1, 6, 2);

  $('submit').disabled = true;
  $('clear').disabled = true;
  setStatus('处理中：读取本地文件、上传 OSS、生成图片…');
  renderResults([]);

  try {
    const images = [];
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      images.push({ name: file.name, dataUrl });
    }

    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, prompt, n }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data?.message ? `${data.error || 'Error'}: ${data.message}` : (data?.error || '请求失败');
      throw new Error(msg);
    }

    renderResults(data.outputImageUrls || []);
    if (data.quota) setAuthUi({ user: currentUser, quota: data.quota });
    setStatus(`完成：生成 ${((data.outputImageUrls || []).length)} 张图片。`);
  } catch (err) {
    setStatus(err?.message || String(err), 'error');
  } finally {
    $('submit').disabled = !currentUser || (currentQuota && currentQuota.remaining <= 0);
    $('clear').disabled = false;
  }
}

function handleClear() {
  $('images').value = '';
  $('prompt').value = '';
  $('n').value = '2';
  $('preview').innerHTML = '';
  $('results').innerHTML = '';
  setStatus('');
}

function appendPreset(key) {
  const snippet = presets[key];
  if (!snippet) return;
  const el = $('prompt');
  const current = el.value.trim();
  const next = current ? `${current}\n${snippet}` : snippet;
  el.value = next;
  el.focus();
}

function init() {
  $('submit').disabled = true;
  for (const section of document.querySelectorAll('[data-auth="required"]')) {
    section.hidden = true;
  }

  const faceStrength = $('faceStrength');
  const faceStrengthValue = $('faceStrengthValue');
  if (faceStrength && faceStrengthValue) {
    const render = () => {
      faceStrengthValue.textContent = String(getFaceStrength());
    };
    faceStrength.addEventListener('input', render);
    render();
  }

  $('images').addEventListener('change', () => {
    const files = Array.from($('images').files || []).slice(0, 6);
    renderPreview(files);
    setStatus('');
  });

  $('submit').addEventListener('click', handleSubmit);
  $('clear').addEventListener('click', handleClear);
  $('openLogin').addEventListener('click', () => {
    setFormError('loginError', '');
    openModal('loginModal');
    $('loginUsername').focus();
  });
  $('openRegister').addEventListener('click', () => {
    setFormError('registerError', '');
    openModal('registerModal');
    $('registerUsername').focus();
  });
  $('doLogin').addEventListener('click', () => handleLogin());
  $('doRegister').addEventListener('click', () => handleRegister());
  $('logout').addEventListener('click', () => handleLogout());

  for (const btn of document.querySelectorAll('[data-close-modal]')) {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  }
  for (const modal of document.querySelectorAll('.modal')) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const modal of document.querySelectorAll('.modal')) {
      if (!modal.hidden) closeModal(modal.id);
    }
  });

  $('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  $('inviteCode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });

  for (const btn of document.querySelectorAll('button[data-prompt]')) {
    btn.addEventListener('click', () => appendPreset(btn.dataset.prompt));
  }

  refreshMe().catch(() => setAuthUi({ user: null, quota: null }));
}

init();
