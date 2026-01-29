const { aliyun } = require('../config');

/**
 * 将 OSS 相对路径转换为完整 URL
 * @param {string} path - OSS 相对路径（如 /ai-image/images/2026-01-29/xxx.jpg）
 * @returns {string} 完整 URL
 */
function getFullImageUrl(path) {
  if (!path) return '';

  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const publicURL = process.env.OSS_PUBLIC_URL || aliyun?.oss?.publicURL || '';
  if (!publicURL) {
    return path; // 如果没有配置 publicURL，返回原路径
  }

  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // 拼接 URL（去掉 publicURL 末尾的 /）
  const baseUrl = publicURL.endsWith('/') ? publicURL.slice(0, -1) : publicURL;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * 批量转换 OSS 路径为完整 URL
 * @param {string[]} paths - OSS 相对路径数组
 * @returns {string[]} 完整 URL 数组
 */
function getFullImageUrls(paths) {
  if (!Array.isArray(paths)) return [];
  return paths.map(getFullImageUrl);
}

/**
 * 从完整 URL 中提取 OSS 相对路径
 * @param {string} url - 完整 URL
 * @returns {string} OSS 相对路径
 */
function extractOssPath(url) {
  if (!url) return '';

  // 如果不是完整 URL，直接返回
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  const publicURL = process.env.OSS_PUBLIC_URL || aliyun?.oss?.publicURL || '';
  if (!publicURL) {
    return url; // 没有配置 publicURL，无法提取
  }

  // 去掉 publicURL，保留路径部分
  const baseUrl = publicURL.endsWith('/') ? publicURL.slice(0, -1) : publicURL;
  if (url.startsWith(baseUrl)) {
    return url.substring(baseUrl.length);
  }

  // 尝试从 URL 中提取路径
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
}

module.exports = { getFullImageUrl, getFullImageUrls, extractOssPath };
