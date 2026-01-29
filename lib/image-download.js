const crypto = require('crypto');
const path = require('path');
const { UploadFile } = require('./OSS');

/**
 * 下载远程图片并上传到 OSS
 * @param {object} axios - axios 实例
 * @param {string} imageUrl - 远程图片URL
 * @param {object} options - 选项
 * @param {string} options.targetDir - 目标目录，默认 /ai-image/images/YYYY-MM-DD
 * @returns {Promise<string>} 返回 OSS 相对路径（如 /ai-image/images/2026-01-29/xxx.jpg）
 */
async function downloadAndUploadImage(axios, imageUrl, options = {}) {
  try {
    // 下载图片
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60秒超时
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // 确定文件扩展名
    let ext = '.jpg';
    if (contentType.includes('png')) ext = '.png';
    else if (contentType.includes('webp')) ext = '.webp';
    else if (contentType.includes('gif')) ext = '.gif';

    // 生成目标路径
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const targetDir = options.targetDir || `/ai-image/images/${dateStr}`;
    const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    const ossKey = path.posix.join(targetDir, filename);

    // 上传到 OSS（这里会返回完整URL，但我们不需要）
    await UploadFile(ossKey, buffer, { mime: contentType });

    // 返回相对路径
    return ossKey;
  } catch (err) {
    throw new Error(`Failed to download and upload image: ${err?.message || String(err)}`);
  }
}

/**
 * 批量下载并上传图片
 * @param {object} axios - axios 实例
 * @param {string[]} imageUrls - 远程图片URL数组
 * @param {object} options - 选项
 * @returns {Promise<string[]>} 返回 OSS 相对路径数组
 */
async function downloadAndUploadImages(axios, imageUrls, options = {}) {
  const results = [];
  for (const url of imageUrls) {
    const ossPath = await downloadAndUploadImage(axios, url, options);
    results.push(ossPath);
  }
  return results;
}

module.exports = { downloadAndUploadImage, downloadAndUploadImages };
