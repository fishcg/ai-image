const dashscope = require('./dashscope');
const nanoai = require('./nanoai');

const providers = new Map([
  [dashscope.id, dashscope],
  [nanoai.id, nanoai],
]);

function getProvider(id) {
  return providers.get(String(id || 'dashscope')) || null;
}

module.exports = { getProvider };
