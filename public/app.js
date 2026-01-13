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
    '保持背景不变，但是去掉背景中的路人/杂物（remove people/clutter），让背景更干净，保留主体完整，边缘自然无涂抹痕迹。',
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
const MODEL_STORAGE_KEY = 'ai-image:modelId';
const NANO_MODEL_IDS = new Set(['google-nano-banana-pro']);
let modalGallery = null;
let modalDrag = null;
let modalPaint = null;
let paintGallery = null;
let paintDrag = null;
const editedImageDataUrls = new Map(); // fileKey -> dataUrl
const originalImageDataUrls = new Map(); // fileKey -> dataUrl (cached)
let isSpaceDown = false;

function isNanoModel(modelId) {
  return NANO_MODEL_IDS.has(String(modelId || ''));
}

function fileKey(file) {
  if (!file) return '';
  return `${file.name}::${file.size}::${file.lastModified}`;
}

function getSelectedFileByKey(key) {
  const k = String(key || '');
  for (const f of selectedFiles || []) {
    if (fileKey(f) === k) return f;
  }
  return null;
}

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
  if (id === 'paintModal') {
    commitPaintedImage();
    modalPaint = null;
    paintDrag = null;
    paintGallery = null;
  }
  if (id === 'imageModal') {
    modalDrag = null;
    modalGallery = null;
  }
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

function setModalImage({ src, title, originalSrc, mode = 'new' }) {
  const img = $('imageModalImg');
  const a = $('imageModalOpen');
  const toggleBtn = $('toggleOriginal');
  if (!img || !a) return false;

  const newSrc = String(src || '');
  const original = String(originalSrc || '');
  const hasOriginal = Boolean(original) && original !== newSrc;

  img.dataset.newSrc = newSrc;
  img.dataset.originalSrc = hasOriginal ? original : '';
  const nextMode = mode === 'original' && hasOriginal ? 'original' : 'new';
  img.dataset.mode = nextMode;
  const nextSrc = nextMode === 'original' ? original : newSrc;
  img.dataset.baseW = '';
  img.dataset.baseH = '';
  img.style.width = '';
  img.style.height = '';
  img.style.maxWidth = '';
  img.style.maxHeight = '';
  img.style.transform = '';
  img.src = nextSrc;
  img.alt = title || 'preview';
  a.href = nextSrc;
  if (toggleBtn) {
    toggleBtn.hidden = !hasOriginal;
    toggleBtn.setAttribute('aria-pressed', nextMode === 'original' ? 'true' : 'false');
    toggleBtn.textContent = nextMode === 'original' ? '显示新图' : '显示原图';
  }
  const t = $('imageTitle');
  if (t) t.textContent = title || '预览';
  return true;
}

function syncModalNavButtons() {
  const prevBtn = $('prevImage');
  const nextBtn = $('nextImage');
  if (!prevBtn || !nextBtn) return;

  const count = modalGallery?.items?.length || 0;
  const idx = clampInt(modalGallery?.index, 0, Math.max(0, count - 1), 0);

  const show = count >= 2;
  prevBtn.hidden = !show;
  nextBtn.hidden = !show;
  prevBtn.disabled = !show || idx <= 0;
  nextBtn.disabled = !show || idx >= count - 1;
}

function getModalZoom() {
  const el = $('zoomRange');
  const percent = clampInt(el ? el.value : 100, 100, 300, 100);
  return percent / 100;
}

function setModalZoom(percent) {
  const el = $('zoomRange');
  const label = $('zoomValue');
  const p = clampInt(percent, 100, 300, 100);
  if (el) el.value = String(p);
  if (label) label.textContent = `${p}%`;
  if (p <= 100) setModalPan(0, 0);
}

function getModalPan() {
  const img = $('imageModalImg');
  const x = Number(img?.dataset?.panX || '0');
  const y = Number(img?.dataset?.panY || '0');
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
}

function setModalPan(x, y) {
  const img = $('imageModalImg');
  if (!img) return;
  img.dataset.panX = String(Math.round(Number(x) || 0));
  img.dataset.panY = String(Math.round(Number(y) || 0));
}

function captureModalBaseSize() {
  const viewer = document.querySelector('#imageModal .imageViewer');
  const img = $('imageModalImg');
  if (!viewer || !img) return;

  const prevTransform = img.style.transform;
  const prevWidth = img.style.width;
  const prevHeight = img.style.height;
  const prevMaxW = img.style.maxWidth;
  const prevMaxH = img.style.maxHeight;
  img.style.transform = 'translate(0px, 0px)';
  img.style.width = '';
  img.style.height = '';
  img.style.maxWidth = '';
  img.style.maxHeight = '';
  const rect = img.getBoundingClientRect();
  img.style.transform = prevTransform;
  img.style.width = prevWidth;
  img.style.height = prevHeight;
  img.style.maxWidth = prevMaxW;
  img.style.maxHeight = prevMaxH;

  img.dataset.baseW = String(Math.max(1, Math.round(rect.width || 0)));
  img.dataset.baseH = String(Math.max(1, Math.round(rect.height || 0)));
}

function clampModalPan(x, y, zoom) {
  const viewer = document.querySelector('#imageModal .imageViewer');
  const img = $('imageModalImg');
  if (!viewer || !img) return { x, y };
  const vw = viewer.clientWidth || 0;
  const vh = viewer.clientHeight || 0;
  const baseW = Number(img.dataset.baseW || '0');
  const baseH = Number(img.dataset.baseH || '0');
  if (!vw || !vh || !baseW || !baseH) return { x, y };

  const scaledW = baseW * zoom;
  const scaledH = baseH * zoom;
  const maxX = Math.max(0, (scaledW - vw) / 2);
  const maxY = Math.max(0, (scaledH - vh) / 2);

  const cx = Math.max(-maxX, Math.min(maxX, x));
  const cy = Math.max(-maxY, Math.min(maxY, y));
  return { x: cx, y: cy };
}

function applyModalTransform() {
  const img = $('imageModalImg');
  if (!img) return;
  const zoom = getModalZoom();
  const { x, y } = getModalPan();

  if (zoom <= 1) {
    img.style.width = '';
    img.style.height = '';
    img.style.maxWidth = '';
    img.style.maxHeight = '';
    img.style.transform = 'translate(0px, 0px)';
    img.style.cursor = '';
    setModalPan(0, 0);
    return;
  }

  const baseW = Number(img.dataset.baseW || '0');
  const baseH = Number(img.dataset.baseH || '0');
  if (!baseW || !baseH) {
    captureModalBaseSize();
  }

  const bw = Number(img.dataset.baseW || '0');
  const bh = Number(img.dataset.baseH || '0');
  if (bw && bh) {
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
    img.style.width = `${Math.max(1, Math.round(bw * zoom))}px`;
    img.style.height = `${Math.max(1, Math.round(bh * zoom))}px`;
  }

  const clamped = clampModalPan(x, y, zoom);
  if (clamped.x !== x || clamped.y !== y) setModalPan(clamped.x, clamped.y);
  img.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
  img.style.cursor = modalDrag ? 'grabbing' : 'grab';
}

function getPaintTransparency() {
  const el = $('paintTransparency');
  return clampInt(el ? el.value : 80, 0, 100, 80);
}

function getPaintAlpha() {
  return 1 - getPaintTransparency() / 100;
}

function syncPaintUi() {
  const badge = $('paintAlphaValue');
  if (badge) badge.textContent = `${Math.round(getPaintAlpha() * 100)}%`;
}

function hexToRgb(hex) {
  const s = String(hex || '').trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(s);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function getPaintColorRgba(alpha) {
  const color = $('paintColor')?.value || '#ff0000';
  const rgb = hexToRgb(color) || { r: 255, g: 0, b: 0 };
  const a = Math.max(0, Math.min(1, Number(alpha)));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

function getPaintFeather() {
  const el = $('paintFeather');
  return clampInt(el ? el.value : 40, 0, 100, 40);
}

function canvasPointFromEvent(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const scaleX = rect.width ? canvas.width / rect.width : 1;
  const scaleY = rect.height ? canvas.height / rect.height : 1;
  return {
    x: Math.max(0, Math.min(canvas.width, cx * scaleX)),
    y: Math.max(0, Math.min(canvas.height, cy * scaleY)),
  };
}

function stampBrush(ctx, x, y, radius, featherPct, rgba) {
  const r = Math.max(1, Number(radius) || 1);
  const f = Math.max(0, Math.min(100, Number(featherPct) || 0)) / 100;
  const inner = Math.max(0, r * (1 - f));

  const grad = ctx.createRadialGradient(x, y, inner, x, y, r);
  grad.addColorStop(0, rgba);
  grad.addColorStop(1, rgba.replace(/rgba\(([^)]+),\s*([01]?\.?\d+)\)/, 'rgba($1, 0)'));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

async function loadImageElement(src) {
  const url = String(src || '');
  if (!url) throw new Error('Missing image src');
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  try {
    await img.decode();
  } catch {
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  }
  return img;
}

async function ensureOriginalDataUrl(key) {
  const k = String(key || '');
  if (!k) return '';
  if (originalImageDataUrls.has(k)) return originalImageDataUrls.get(k);
  const f = getSelectedFileByKey(k);
  if (!f) return '';
  const dataUrl = await fileToDataUrl(f);
  originalImageDataUrls.set(k, dataUrl);
  return dataUrl;
}

function updatePreviewThumbSrc(key, dataUrl) {
  const k = String(key || '');
  const url = String(dataUrl || '');
  if (!k || !url) return;
  const el = document.querySelector(`#preview img[data-file-key="${CSS.escape(k)}"]`);
  if (!el) return;
  el.src = url;
  el.dataset.fullSrc = url;
}

function startPaintSession(fileKeyValue) {
  modalPaint = { fileKey: String(fileKeyValue || ''), undo: null };
  const undoBtn = $('paintUndo');
  if (undoBtn) undoBtn.disabled = true;
}

function commitPaintedImage() {
  const key = modalPaint?.fileKey;
  const canvas = $('paintCanvas');
  if (!key || !canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  editedImageDataUrls.set(key, dataUrl);
  updatePreviewThumbSrc(key, dataUrl);
}

function undoPaint() {
  const canvas = $('paintCanvas');
  const ctx = canvas?.getContext?.('2d');
  if (!canvas || !ctx || !modalPaint?.undo) return;
  ctx.putImageData(modalPaint.undo, 0, 0);
  modalPaint.undo = null;
  const undoBtn = $('paintUndo');
  if (undoBtn) undoBtn.disabled = true;
  commitPaintedImage();
}

function getPaintZoom() {
  const el = $('paintZoomRange');
  const percent = clampInt(el ? el.value : 100, 100, 300, 100);
  return percent / 100;
}

function setPaintZoom(percent) {
  const el = $('paintZoomRange');
  const label = $('paintZoomValue');
  const p = clampInt(percent, 100, 300, 100);
  if (el) el.value = String(p);
  if (label) label.textContent = `${p}%`;
  if (p <= 100) setPaintPan(0, 0);
}

function getPaintPan() {
  const canvas = $('paintCanvas');
  const x = Number(canvas?.dataset?.panX || '0');
  const y = Number(canvas?.dataset?.panY || '0');
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
}

function setPaintPan(x, y) {
  const canvas = $('paintCanvas');
  if (!canvas) return;
  canvas.dataset.panX = String(Math.round(Number(x) || 0));
  canvas.dataset.panY = String(Math.round(Number(y) || 0));
}

function capturePaintBaseSize() {
  const viewer = document.querySelector('#paintModal .imageViewer');
  const canvas = $('paintCanvas');
  if (!viewer || !canvas) return;

  const prevTransform = canvas.style.transform;
  const prevWidth = canvas.style.width;
  const prevHeight = canvas.style.height;
  const prevMaxW = canvas.style.maxWidth;
  const prevMaxH = canvas.style.maxHeight;
  canvas.style.transform = 'translate(0px, 0px)';
  canvas.style.width = '';
  canvas.style.height = '';
  canvas.style.maxWidth = '';
  canvas.style.maxHeight = '';
  const rect = canvas.getBoundingClientRect();
  canvas.style.transform = prevTransform;
  canvas.style.width = prevWidth;
  canvas.style.height = prevHeight;
  canvas.style.maxWidth = prevMaxW;
  canvas.style.maxHeight = prevMaxH;

  canvas.dataset.baseW = String(Math.max(1, Math.round(rect.width || 0)));
  canvas.dataset.baseH = String(Math.max(1, Math.round(rect.height || 0)));
}

function clampPaintPan(x, y, zoom) {
  const viewer = document.querySelector('#paintModal .imageViewer');
  const canvas = $('paintCanvas');
  if (!viewer || !canvas) return { x, y };
  const vw = viewer.clientWidth || 0;
  const vh = viewer.clientHeight || 0;
  const baseW = Number(canvas.dataset.baseW || '0');
  const baseH = Number(canvas.dataset.baseH || '0');
  if (!vw || !vh || !baseW || !baseH) return { x, y };

  const scaledW = baseW * zoom;
  const scaledH = baseH * zoom;
  const maxX = Math.max(0, (scaledW - vw) / 2);
  const maxY = Math.max(0, (scaledH - vh) / 2);

  const cx = Math.max(-maxX, Math.min(maxX, x));
  const cy = Math.max(-maxY, Math.min(maxY, y));
  return { x: cx, y: cy };
}

function applyPaintTransform() {
  const canvas = $('paintCanvas');
  if (!canvas) return;
  const zoom = getPaintZoom();
  const { x, y } = getPaintPan();

  if (zoom <= 1) {
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.maxWidth = '';
    canvas.style.maxHeight = '';
    canvas.style.transform = 'translate(0px, 0px)';
    canvas.style.cursor = 'crosshair';
    setPaintPan(0, 0);
    return;
  }

  const baseW = Number(canvas.dataset.baseW || '0');
  const baseH = Number(canvas.dataset.baseH || '0');
  if (!baseW || !baseH) capturePaintBaseSize();

  const bw = Number(canvas.dataset.baseW || '0');
  const bh = Number(canvas.dataset.baseH || '0');
  if (bw && bh) {
    canvas.style.maxWidth = 'none';
    canvas.style.maxHeight = 'none';
    canvas.style.width = `${Math.max(1, Math.round(bw * zoom))}px`;
    canvas.style.height = `${Math.max(1, Math.round(bh * zoom))}px`;
  }

  const clamped = clampPaintPan(x, y, zoom);
  if (clamped.x !== x || clamped.y !== y) setPaintPan(clamped.x, clamped.y);
  canvas.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
  canvas.style.cursor = zoom > 1 && (paintDrag || isSpaceDown) ? (paintDrag ? 'grabbing' : 'grab') : 'crosshair';
}

function syncPaintNavButtons() {
  const prevBtn = $('paintPrev');
  const nextBtn = $('paintNext');
  if (!prevBtn || !nextBtn) return;
  const count = paintGallery?.items?.length || 0;
  const idx = clampInt(paintGallery?.index, 0, Math.max(0, count - 1), 0);
  const show = count >= 2;
  prevBtn.hidden = !show;
  nextBtn.hidden = !show;
  prevBtn.disabled = !show || idx <= 0;
  nextBtn.disabled = !show || idx >= count - 1;
}

async function showPaintGalleryIndex(index) {
  const items = paintGallery?.items;
  if (!Array.isArray(items) || items.length === 0) return;

  commitPaintedImage();

  const i = clampInt(index, 0, items.length - 1, 0);
  paintGallery.index = i;

  const item = items[i] || {};
  const key = String(item.fileKey || '');
  if (!key) return;

  syncPaintUi();
  startPaintSession(key);
  setPaintZoom(100);
  setPaintPan(0, 0);

  const canvas = $('paintCanvas');
  if (!canvas) return;

  const src = editedImageDataUrls.get(key) || (await ensureOriginalDataUrl(key));
  if (!src) return;

  const img = await loadImageElement(src);
  const maxSide = 4096;
  let w = img.naturalWidth || img.width || 1;
  let h = img.naturalHeight || img.height || 1;
  if (Math.max(w, h) > maxSide) {
    const scale = maxSide / Math.max(w, h);
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
  }

  canvas.width = w;
  canvas.height = h;
  canvas.dataset.baseW = '';
  canvas.dataset.baseH = '';
  canvas.style.width = '';
  canvas.style.height = '';
  canvas.style.maxWidth = '';
  canvas.style.maxHeight = '';
  canvas.style.transform = '';
  canvas.dataset.panX = '0';
  canvas.dataset.panY = '0';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const t = $('paintTitle');
  if (t) t.textContent = item.title || '原图涂抹';

  setTimeout(() => {
    capturePaintBaseSize();
    applyPaintTransform();
    syncPaintNavButtons();
  }, 0);
}

function openPaintModal({ items, index }) {
  paintGallery = { items: Array.isArray(items) ? items : [], index: clampInt(index, 0, Math.max(0, (items?.length || 1) - 1), 0) };
  showPaintGalleryIndex(paintGallery.index).catch(() => {});
  syncPaintNavButtons();
  openModal('paintModal');
}

function openPaintForFile({ fileKey: key }) {
  const k = String(key || '');
  if (!k) return;
  const idx = Math.max(0, (selectedFiles || []).findIndex((f) => fileKey(f) === k));
  const items = (selectedFiles || []).map((f, i) => ({ fileKey: fileKey(f), title: `原图 ${i + 1}：${f.name}` }));
  openPaintModal({ items, index: idx === -1 ? 0 : idx });
}

function showModalGalleryIndex(index) {
  const items = modalGallery?.items;
  if (!Array.isArray(items) || items.length === 0) return;
  const i = clampInt(index, 0, items.length - 1, 0);
  modalGallery.index = i;

  const item = items[i] || {};
  const img = $('imageModalImg');
  const mode = img?.dataset?.mode === 'original' ? 'original' : 'new';
  setModalImage({ src: item.src, title: item.title, originalSrc: item.originalSrc, mode });
  setModalZoom(100);
  setModalPan(0, 0);
  captureModalBaseSize();
  applyModalTransform();
  syncModalNavButtons();
}

function openImageViewer({ src, title, originalSrc, gallery }) {
  if (gallery && Array.isArray(gallery.items)) {
    const idx = clampInt(gallery.index, 0, Math.max(0, gallery.items.length - 1), 0);
    modalGallery = { items: gallery.items, index: idx };
  } else {
    modalGallery = { items: [{ kind: 'output', src, originalSrc, title }], index: 0 };
  }

  showModalGalleryIndex(modalGallery.index || 0);
  syncModalNavButtons();
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

function syncModelConstraints() {
  const modelId = String($('modelId')?.value || 'dashscope');
  const nInput = $('n');
  const nHint = $('nHint');
  if (!nInput) return;

  if (isNanoModel(modelId)) {
    nInput.min = '1';
    nInput.max = '1';
    nInput.value = '1';
    nInput.disabled = true;
    if (nHint) nHint.textContent = 'Nano 模型仅支持生成 1 张。';
  } else {
    nInput.min = '1';
    nInput.max = '6';
    nInput.disabled = false;
    nInput.value = String(clampInt(nInput.value, 1, 6, 2));
    if (nHint) nHint.textContent = '';
  }
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
    const key = fileKey(file);
    const div = document.createElement('div');
    div.className = 'thumb';
    if (idx === baseIdx && files.length >= 2) div.classList.add('base');

    const order = document.createElement('div');
    order.className = 'order';
    order.textContent = String(idx + 1);

    const img = document.createElement('img');
    img.alt = file.name;
    img.dataset.fileKey = key;
    const edited = key ? editedImageDataUrls.get(key) : '';
    img.src = edited || URL.createObjectURL(file);
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
  const results = $('results');
  results.innerHTML = '';

  if (!urls || urls.length === 0) {
    results.innerHTML = '<div class="hint">暂无结果。</div>';
    return;
  }

  for (const url of urls) results.appendChild(buildResultNode(url));
}

function buildResultNode(url, { originalSrc } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'result';

  const img = document.createElement('img');
  img.src = url;
  img.alt = 'output';
  img.dataset.fullSrc = url;
  if (originalSrc) img.dataset.originalSrc = String(originalSrc);

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
  return wrap;
}

function setResultsLoading(loading) {
  const results = $('results');
  if (!results) return;

  const existing = $('resultsLoading');
  if (!loading) {
    existing?.remove?.();
    return;
  }

  if (existing) return;
  const el = document.createElement('div');
  el.id = 'resultsLoading';
  el.className = 'hint';
  el.textContent = '生成中...';
  results.insertBefore(el, results.firstChild);
}

function prependResults(urls, { originalSrc } = {}) {
  const results = $('results');
  if (!results) return;
  if (!urls || urls.length === 0) return;

  const emptyHint = results.querySelector('.hint');
  if (emptyHint && emptyHint.id !== 'resultsLoading') emptyHint.remove();

  const loadingEl = $('resultsLoading');
  const anchor = loadingEl ? loadingEl.nextSibling : results.firstChild;

  for (const url of urls) {
    results.insertBefore(buildResultNode(url, { originalSrc }), anchor);
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

  const modelId = String($('modelId')?.value || 'dashscope');
  const maxN = isNanoModel(modelId) ? 1 : 6;
  const defaultN = isNanoModel(modelId) ? 1 : 2;
  const n = clampInt($('n')?.value, 1, maxN, defaultN);

  $('submit').disabled = true;
  $('submit').classList.add('loading');
  $('clear').disabled = true;
  setStatus('生成中，请等待…');
  setResultsLoading(true);

  try {
    const images = [];
    for (const file of files) {
      const key = fileKey(file);
      const edited = key ? editedImageDataUrls.get(key) : '';
      const dataUrl = edited || (await fileToDataUrl(file));
      images.push({ name: file.name, dataUrl });
    }

    const baseIndex = clampInt($('baseIndex')?.value, 1, 3, 1) - 1;
    const originalSrc = images[clampInt(baseIndex, 0, images.length - 1, 0)]?.dataUrl || '';
    const orderedImages = images.length >= 2 ? moveIndexToEnd(images, baseIndex) : images;
    const orderHint = buildOrderHint(files, baseIndex);
    const finalPrompt = orderHint ? `${orderHint}\n\n${prompt}` : prompt;
    const hd = Boolean($('hd')?.checked);

    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: orderedImages, prompt: finalPrompt, n, hd, modelId }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data?.message ? `${data.error || 'Error'}: ${data.message}` : (data?.error || '请求失败');
      throw new Error(msg);
    }

    setResultsLoading(false);
    prependResults(data.outputImageUrls || [], { originalSrc });
    if (data.quota) setAuthUi({ user: currentUser, quota: data.quota });
    setStatus(`完成：生成 ${((data.outputImageUrls || []).length)} 张图片。`);
  } catch (err) {
    setResultsLoading(false);
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
  editedImageDataUrls.clear();
  originalImageDataUrls.clear();
  modalPaint = null;
  updateFileInfo([]);
  $('baseIndexWrap').hidden = true;
  $('results').innerHTML = '';
  selectedPresets.clear();
  syncPresetUi();
  syncPromptWithSelectedPresets();
  syncModelConstraints();
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
    const key = img.dataset.fileKey || '';
    const items = (selectedFiles || []).map((f, idx) => ({
      fileKey: fileKey(f),
      title: `原图 ${idx + 1}：${f.name}`,
    }));
    const index = Math.max(0, items.findIndex((it) => it.fileKey === key));
    openPaintModal({ items, index: index === -1 ? 0 : index });
  });

  $('results')?.addEventListener('click', (e) => {
    const img = e.target?.closest?.('img');
    if (!img) return;
    const src = img.dataset.fullSrc || img.src;
    const originalSrc = img.dataset.originalSrc || '';
    const imgs = Array.from($('results')?.querySelectorAll?.('.result img') || []);
    const items = imgs.map((el) => ({
      kind: 'output',
      src: el.dataset.fullSrc || el.src,
      title: '输出预览',
      originalSrc: el.dataset.originalSrc || '',
    }));
    const index = Math.max(0, imgs.indexOf(img));
    openImageViewer({ src, title: '输出预览', originalSrc, gallery: { items, index } });
  });

  $('toggleOriginal')?.addEventListener('click', () => {
    const img = $('imageModalImg');
    const a = $('imageModalOpen');
    const btn = $('toggleOriginal');
    if (!img || !a || !btn) return;
    const newSrc = String(img.dataset.newSrc || img.src || '');
    const originalSrc = String(img.dataset.originalSrc || '');
    if (!originalSrc) return;

    const isShowingOriginal = img.dataset.mode === 'original';
    const nextMode = isShowingOriginal ? 'new' : 'original';
    img.dataset.mode = nextMode;
    const nextSrc = nextMode === 'original' ? originalSrc : newSrc;
    img.src = nextSrc;
    a.href = nextSrc;
    btn.setAttribute('aria-pressed', nextMode === 'original' ? 'true' : 'false');
    btn.textContent = nextMode === 'original' ? '显示新图' : '显示原图';
  });

  const zoomRange = $('zoomRange');
  if (zoomRange) {
    zoomRange.addEventListener('input', () => {
      const percent = clampInt(zoomRange.value, 100, 300, 100);
      setModalZoom(percent);
      applyModalTransform();
    });
  }

  $('imageModalImg')?.addEventListener('load', () => {
    captureModalBaseSize();
    applyModalTransform();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    isSpaceDown = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.code !== 'Space') return;
    isSpaceDown = false;
  });

  const startPreviewPan = (e, el) => {
    const zoom = getModalZoom();
    if (zoom <= 1) return;
    e.preventDefault();
    const { x, y } = getModalPan();
    modalDrag = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseX: x, baseY: y };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    applyModalTransform();
  };

  const movePreviewPan = (e) => {
    if (!modalDrag || modalDrag.pointerId !== e.pointerId) return;
    const zoom = getModalZoom();
    if (zoom <= 1) return;
    const dx = e.clientX - modalDrag.startX;
    const dy = e.clientY - modalDrag.startY;
    const nextX = modalDrag.baseX + dx;
    const nextY = modalDrag.baseY + dy;
    const clamped = clampModalPan(nextX, nextY, zoom);
    setModalPan(clamped.x, clamped.y);
    applyModalTransform();
  };

  const endPreviewPan = (e) => {
    if (!modalDrag || modalDrag.pointerId !== e.pointerId) return;
    modalDrag = null;
    applyModalTransform();
  };

  const imgEl = $('imageModalImg');
  if (imgEl) {
    imgEl.addEventListener('pointerdown', (e) => startPreviewPan(e, imgEl));
    imgEl.addEventListener('pointermove', movePreviewPan);
    imgEl.addEventListener('pointerup', endPreviewPan);
    imgEl.addEventListener('pointercancel', endPreviewPan);
  }

  const paintZoomRange = $('paintZoomRange');
  if (paintZoomRange) {
    paintZoomRange.addEventListener('input', () => {
      const percent = clampInt(paintZoomRange.value, 100, 300, 100);
      setPaintZoom(percent);
      applyPaintTransform();
    });
  }

  const startPaintPan = (e, el) => {
    const zoom = getPaintZoom();
    if (zoom <= 1) return;
    e.preventDefault();
    const { x, y } = getPaintPan();
    paintDrag = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseX: x, baseY: y };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    applyPaintTransform();
  };

  const movePaintPan = (e) => {
    if (!paintDrag || paintDrag.pointerId !== e.pointerId) return;
    const zoom = getPaintZoom();
    if (zoom <= 1) return;
    const dx = e.clientX - paintDrag.startX;
    const dy = e.clientY - paintDrag.startY;
    const nextX = paintDrag.baseX + dx;
    const nextY = paintDrag.baseY + dy;
    const clamped = clampPaintPan(nextX, nextY, zoom);
    setPaintPan(clamped.x, clamped.y);
    applyPaintTransform();
  };

  const endPaintPan = (e) => {
    if (!paintDrag || paintDrag.pointerId !== e.pointerId) return;
    paintDrag = null;
    applyPaintTransform();
  };

  const canvasEl = $('paintCanvas');
  if (canvasEl) {
    canvasEl.addEventListener('pointerdown', (e) => {
      const zoom = getPaintZoom();
      if (zoom > 1 && isSpaceDown) {
        startPaintPan(e, canvasEl);
        return;
      }

      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;
      e.preventDefault();
      const { x, y } = canvasPointFromEvent(e, canvasEl);

      if (modalPaint && !modalPaint.undo) {
        try {
          modalPaint.undo = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
        } catch {}
        const undoBtn = $('paintUndo');
        if (undoBtn) undoBtn.disabled = !modalPaint.undo;
      }

      modalPaint = modalPaint || {};
      modalPaint.pointerId = e.pointerId;
      modalPaint.drawing = true;
      modalPaint.lastX = x;
      modalPaint.lastY = y;

      try {
        canvasEl.setPointerCapture(e.pointerId);
      } catch {}

      const alpha = getPaintAlpha();
      const feather = getPaintFeather();
      const rgba = getPaintColorRgba(alpha);
      stampBrush(ctx, x, y, 28, feather, rgba);
    });

    canvasEl.addEventListener('pointermove', (e) => {
      if (!modalPaint?.drawing || modalPaint.pointerId !== e.pointerId) {
        movePaintPan(e);
        return;
      }
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;
      e.preventDefault();
      const pt = canvasPointFromEvent(e, canvasEl);

      const alpha = getPaintAlpha();
      const feather = getPaintFeather();
      const rgba = getPaintColorRgba(alpha);
      const radius = 28;
      const spacing = Math.max(3, radius * 0.35);

      const x0 = modalPaint.lastX;
      const y0 = modalPaint.lastY;
      const dx = pt.x - x0;
      const dy = pt.y - y0;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(dist / spacing));
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        stampBrush(ctx, x0 + dx * t, y0 + dy * t, radius, feather, rgba);
      }

      modalPaint.lastX = pt.x;
      modalPaint.lastY = pt.y;
    });

    const endPaint = (e) => {
      if (modalPaint?.drawing && modalPaint.pointerId === e.pointerId) {
        modalPaint.drawing = false;
        modalPaint.pointerId = null;
        commitPaintedImage();
      } else {
        endPaintPan(e);
      }
    };
    canvasEl.addEventListener('pointerup', endPaint);
    canvasEl.addEventListener('pointercancel', endPaint);
  }

  $('paintTransparency')?.addEventListener('input', syncPaintUi);
  $('paintUndo')?.addEventListener('click', () => undoPaint());
  $('paintReset')?.addEventListener('click', async () => {
    const key = modalPaint?.fileKey;
    const canvas = $('paintCanvas');
    const ctx = canvas?.getContext?.('2d');
    if (!key || !canvas || !ctx) return;
    const src = await ensureOriginalDataUrl(key);
    if (!src) return;
    const img = await loadImageElement(src);
    const maxSide = 4096;
    let w = img.naturalWidth || img.width || 1;
    let h = img.naturalHeight || img.height || 1;
    if (Math.max(w, h) > maxSide) {
      const scale = maxSide / Math.max(w, h);
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    modalPaint.undo = null;
    const undoBtn = $('paintUndo');
    if (undoBtn) undoBtn.disabled = true;
    commitPaintedImage();
    setPaintZoom(100);
    capturePaintBaseSize();
    applyPaintTransform();
  });

  $('paintPrev')?.addEventListener('click', () => {
    if (!paintGallery) return;
    showPaintGalleryIndex((paintGallery.index || 0) - 1).catch(() => {});
  });
  $('paintNext')?.addEventListener('click', () => {
    if (!paintGallery) return;
    showPaintGalleryIndex((paintGallery.index || 0) + 1).catch(() => {});
  });

  $('prevImage')?.addEventListener('click', () => {
    if (!modalGallery) return;
    showModalGalleryIndex((modalGallery.index || 0) - 1);
  });
  $('nextImage')?.addEventListener('click', () => {
    if (!modalGallery) return;
    showModalGalleryIndex((modalGallery.index || 0) + 1);
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

  const modelSelect = $('modelId');
  if (modelSelect) {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY);
    if (saved) modelSelect.value = saved;
    modelSelect.addEventListener('change', () => {
      localStorage.setItem(MODEL_STORAGE_KEY, String(modelSelect.value || 'dashscope'));
      syncModelConstraints();
    });
  }
  syncModelConstraints();

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

  window.addEventListener('resize', () => {
    if (!$('imageModal')?.hidden) {
      captureModalBaseSize();
      applyModalTransform();
    }
    if (!$('paintModal')?.hidden) {
      capturePaintBaseSize();
      applyPaintTransform();
    }
  });
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
