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
    '让人物的武器（非人物本身）附带对应的光效，发光边缘干净，带轻微光晕与溢光，保持武器材质细节与轮廓不变。',
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
  '光斑漏光':
    '加入镜头光斑与漏光（lens flare/light leak），光斑位置自然，避免遮挡面部，整体更有氛围感。',
  '雨天氛围':
    '添加雨丝与雨雾氛围（rain/mist），地面与衣物轻微湿润高光，光影真实，主体清晰。',
  '雪花效果':
    '添加飘落雪花与冷色氛围（snow），雪花层次丰富，景深虚化自然，避免覆盖面部。',
  '尘埃粒子':
    '加入空气尘埃/漂浮颗粒（dust particles），逆光可见，细腻不脏，增强空间感。',
  '体积光':
    '添加体积光/上帝光（volumetric light），光束方向明确，层次分明，主体曝光正确。',
  '逆光轮廓光':
    '增加强逆光与轮廓光（backlight/rim light），边缘干净不溢出，突出主体立体感。',
  '肤色校正':
    '进行肤色校正与均匀肤色（skin tone correction），减少泛黄/泛红，保留皮肤质感不过度磨皮。',
  '美白牙齿':
    '美白牙齿（teeth whitening），自然不过白，保留牙齿纹理，唇部与口腔细节正常。',
  '眼神增强':
    '增强眼神与眼部对比（eye enhancement），虹膜更清晰、眼白更干净，保持眼型不变。',
  'HDR 质感':
    '提升动态范围与细节层次（HDR look），暗部提亮高光压制，质感更强但不脏不灰。',
  '暗角':
    '添加轻微暗角（vignette），聚焦主体，过渡柔和不影响画面中心曝光。',
  '胶片颗粒':
    '加入细腻胶片颗粒（film grain），颗粒均匀自然，增强质感但不影响清晰度。',
  '色温调整-暖':
    '整体色温偏暖（warm tone），肤色更健康，避免偏黄发脏，白平衡自然。',
  '色温调整-冷':
    '整体色温偏冷（cool tone），更通透清爽，避免偏蓝发灰，白平衡自然。',
  '去路人':
    '去掉背景路人/杂物（remove people/clutter），背景更干净，保留主体完整，边缘自然无涂抹痕迹。',
  '背景简化':
    '简化背景元素与纹理（background simplify），减少干扰物，主体突出，避免背景变形与糊成一片。',
  '漫展补光':
    '模拟漫展现场补光与提亮（fill light），暗部更通透，肤色更干净，保持高光不过曝。',
  '去反光':
    '减少眼镜/镜片/护目镜反光（reduce glare），保留镜片质感与透明度，眼睛清晰。',
  '去油光':
    '减少面部油光与反光点（reduce shine），T 区更干净，保留皮肤质感不过度磨皮。',
  '服装质感':
    '增强服装与道具材质细节（fabric/material detail），纹理更清晰，金属更有质感，避免塑料感。',
  '假发发丝修复':
    '修复假发发丝与边缘毛躁（wig hair fix），发丝更顺、更自然，边缘干净不抠图感。',
  '妆容增强':
    '增强眼妆/唇妆细节（makeup enhancement），线条更干净、颜色更高级，但保持原本妆面风格不改脸型。',
  '舞台光晕':
    '加入舞台灯光光晕与溢光（stage bloom），氛围更强但主体依旧清晰，避免糊脸。',
  '彩灯散景':
    '加入背景彩灯散景（festival bokeh lights），颜色丰富但不过饱和，景深自然，主体突出。',
  '降摩尔纹':
    '减少衣物/背景网格摩尔纹（moire reduction），纹理更自然，保持清晰度不过度涂抹。',
};

function $(id) {
  return document.getElementById(id);
}

let currentUser = null;
let currentQuota = null;
let selectedFiles = [];
const selectedPresets = new Set();

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

function openImageViewer({ src, title }) {
  const img = $('imageModalImg');
  const a = $('imageModalOpen');
  if (!img || !a) return;
  img.src = src;
  img.alt = title || 'preview';
  a.href = src;
  const t = $('imageTitle');
  if (t) t.textContent = title || '预览';
  openModal('imageModal');
}

function setAuthUi({ user, quota }) {
  currentUser = user || null;
  currentQuota = quota || null;

  for (const section of document.querySelectorAll('[data-auth="required"]')) {
    section.hidden = !currentUser;
  }
  for (const section of document.querySelectorAll('[data-auth="guest"]')) {
    section.hidden = Boolean(currentUser);
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
    updateFileInfo([]);
    selectedPresets.clear();
    syncPresetUi();
    $('prompt').value = '';
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

  const baseIdx = clampInt($('baseIndex')?.value, 1, 3, 1) - 1;

  for (const [idx, file] of files.entries()) {
    const div = document.createElement('div');
    div.className = 'thumb';
    if (idx === baseIdx && files.length >= 2) div.classList.add('base');

    const order = document.createElement('div');
    order.className = 'order';
    order.textContent = String(idx + 1);

    const img = document.createElement('img');
    img.alt = file.name;
    img.src = URL.createObjectURL(file);
    img.dataset.fullSrc = img.src;

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = `${idx + 1}. ${file.name}`;

    div.appendChild(order);
    div.appendChild(img);
    div.appendChild(name);
    preview.appendChild(div);
  }
}

function renderResults(urls) {
  if (urls === null) {
    $('results').innerHTML = '<div class="hint">生成中...</div>';
    return;
  }
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
    img.dataset.fullSrc = url;

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

function updateFileInfo(files) {
  const el = $('fileInfo');
  if (!el) return;
  if (!files || files.length === 0) {
    el.textContent = '未选择';
    return;
  }
  if (files.length === 1) {
    el.textContent = `已选择：${files[0].name}`;
    return;
  }
  el.textContent = `已选择 ${files.length} 张：${files.map((f) => f.name).join('、')}`;
}

async function handleSubmit() {
  const files = selectedFiles.length ? selectedFiles : Array.from($('images').files || []);
  if (files.length === 0) {
    setStatus('请先选择图片。', 'error');
    return;
  }
  if (files.length > 3) {
    setStatus('输入图片最多 3 张。', 'error');
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
  $('submit').classList.add('loading');
  $('clear').disabled = true;
  setStatus('生成中，请等待…');
  renderResults(null);

  try {
    const images = [];
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      images.push({ name: file.name, dataUrl });
    }

    const baseIndex = clampInt($('baseIndex')?.value, 1, 3, 1) - 1;
    const orderedImages = images.length >= 2 ? moveIndexToEnd(images, baseIndex) : images;
    const orderHint = buildOrderHint(files, baseIndex);
    const finalPrompt = orderHint ? `${orderHint}\n\n${prompt}` : prompt;
    const hd = Boolean($('hd')?.checked);

    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: orderedImages, prompt: finalPrompt, n, hd }),
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
    $('submit').classList.remove('loading');
    $('clear').disabled = false;
  }
}

function handleClear() {
  $('images').value = '';
  $('prompt').value = '';
  $('n').value = '2';
  $('preview').innerHTML = '';
  selectedFiles = [];
  updateFileInfo([]);
  $('baseIndexWrap').hidden = true;
  $('results').innerHTML = '';
  selectedPresets.clear();
  syncPresetUi();
  syncPromptWithSelectedPresets();
  setStatus('');
}

function appendPreset(key) {
  const snippet = presets[key];
  if (!snippet) return;
  if (selectedPresets.has(key)) {
    selectedPresets.delete(key);
    removePresetFromPrompt(snippet);
  } else {
    selectedPresets.add(key);
    addPresetToPrompt(snippet);
  }
  syncPresetUi();
}

function init() {
  $('submit').disabled = true;
  for (const section of document.querySelectorAll('[data-auth="required"]')) {
    section.hidden = true;
  }
  for (const section of document.querySelectorAll('[data-auth="guest"]')) {
    section.hidden = false;
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
    selectedFiles = Array.from($('images').files || []).slice(0, 3);
    syncBaseIndexOptions(selectedFiles.length);
    renderPreview(selectedFiles);
    updateFileInfo(selectedFiles);
    setStatus('');
  });

  $('preview')?.addEventListener('click', (e) => {
    const img = e.target?.closest?.('img');
    if (!img) return;
    const src = img.dataset.fullSrc || img.src;
    openImageViewer({ src, title: img.alt || '预览' });
  });

  $('results')?.addEventListener('click', (e) => {
    const img = e.target?.closest?.('img');
    if (!img) return;
    const src = img.dataset.fullSrc || img.src;
    openImageViewer({ src, title: '输出预览' });
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
  $('guestLogin')?.addEventListener('click', () => $('openLogin')?.click());
  $('guestRegister')?.addEventListener('click', () => $('openRegister')?.click());

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

  $('baseIndex')?.addEventListener('change', () => {
    if (selectedFiles.length) renderPreview(selectedFiles);
  });

  syncPresetUi();
  refreshMe().catch(() => setAuthUi({ user: null, quota: null }));
}

init();

function syncBaseIndexOptions(count) {
  const wrap = $('baseIndexWrap');
  const select = $('baseIndex');
  if (!wrap || !select) return;

  if (count >= 2) {
    wrap.hidden = false;
  } else {
    wrap.hidden = true;
  }

  select.innerHTML = '';
  const max = Math.max(1, Math.min(3, count || 1));
  for (let i = 1; i <= max; i += 1) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `第 ${i} 张`;
    select.appendChild(opt);
  }
  if (!select.value) select.value = '1';
}

function moveIndexToEnd(arr, index) {
  const i = clampInt(index, 0, arr.length - 1, 0);
  if (arr.length <= 1) return arr.slice();
  if (i === arr.length - 1) return arr.slice();
  const out = arr.slice();
  const [item] = out.splice(i, 1);
  out.push(item);
  return out;
}

function buildOrderHint(files, baseIndex) {
  if (!files || files.length < 2) return '';
  const base = clampInt(baseIndex, 0, files.length - 1, 0) + 1;
  const pairs = files.map((f, idx) => `${idx + 1}=${f.name}`);
  return `输入图片编号（从左到右）：${pairs.join('，')}。底图（被修改）= 第${base}张。`;
}

function syncPresetUi() {
  for (const btn of document.querySelectorAll('button[data-prompt]')) {
    const key = btn.dataset.prompt;
    btn.classList.toggle('selected', selectedPresets.has(key));
  }
}

function normalizeNewlines(text) {
  return String(text || '').replace(/\n{3,}/g, '\n\n');
}

function addPresetToPrompt(snippet) {
  const el = $('prompt');
  if (!el) return;
  const base = el.value.trimEnd();
  const next = base ? `${base}\n${snippet}` : snippet;
  el.value = normalizeNewlines(next).trim();
  el.focus();
  try {
    el.setSelectionRange(el.value.length, el.value.length);
    el.scrollTop = el.scrollHeight;
  } catch {}
}

function removePresetFromPrompt(snippet) {
  const el = $('prompt');
  if (!el) return;
  let text = String(el.value || '');
  const target = String(snippet || '');
  if (!target) return;

  let idx = text.indexOf(target);
  while (idx !== -1) {
    const before = text.slice(0, idx);
    const after = text.slice(idx + target.length);

    let newBefore = before;
    let newAfter = after;

    // remove one adjacent newline around the snippet to keep layout tight
    if (newBefore.endsWith('\n') && newAfter.startsWith('\n')) {
      newBefore = newBefore.slice(0, -1);
    } else if (newBefore.endsWith('\n')) {
      newBefore = newBefore.slice(0, -1);
    } else if (newAfter.startsWith('\n')) {
      newAfter = newAfter.slice(1);
    }

    text = `${newBefore}${newAfter}`;
    idx = text.indexOf(target);
  }

  el.value = normalizeNewlines(text).trim();
  el.focus();
  try {
    el.setSelectionRange(el.value.length, el.value.length);
    el.scrollTop = el.scrollHeight;
  } catch {}
}
