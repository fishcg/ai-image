const assert = require('node:assert/strict');
const test = require('node:test');
const { detectImageMime } = require('../../lib/image');

test('根据图片文件头识别 MIME，不依赖下载响应头', () => {
  assert.equal(detectImageMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
  assert.equal(detectImageMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(detectImageMime(Buffer.from('RIFF1234WEBP', 'ascii')), 'image/webp');
  assert.equal(detectImageMime(Buffer.from('GIF89a', 'ascii')), 'image/gif');
  assert.equal(detectImageMime(Buffer.from('not-an-image')), null);
});
