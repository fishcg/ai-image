const OSS = require('ali-oss');
const { aliyun } = require('../config.js');

let client = new OSS(aliyun.oss)

/**
 * 上传文件到 OSS 并返回地址
 *
 * @param {string} targetObjectKey 目标对象键（OSS中的路径）
 * @param {string|Buffer} sourceFilePathOrBuffer 源文件路径（本地文件路径）或 Buffer
 * @param {object} [options] ali-oss put options（如 { mime: 'image/png' }）
 * @return {Promise<string>} 返回上传后的文件URL
*/
async function UploadFile(targetObjectKey, sourceFilePathOrBuffer, options = undefined) {
  try {
    let body = await client.put(targetObjectKey, sourceFilePathOrBuffer, options);
    if (200 !== body.res.status) {
      throw new Error(`Failed to upload file to OSS. Status: ${body.res.status}`);
    }
    return body.res.requestUrls[0]
  } catch (err) {
    throw err;
  }
}

/**
 * 删除 OSS 上的文件
 *
 * @param {string} targetObjectKey 目标对象键（OSS中的路径）
 * @return {Promise<boolean>}
 */
async function DelOssFile(targetObjectKey) {
  try {
    await client.delete(targetObjectKey);
    return true
  } catch (err) {
    throw err;
  }
}

module.exports = { UploadFile, DelOssFile };
