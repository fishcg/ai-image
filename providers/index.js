const dashscope = require('./dashscope');
const nanoai = require('./nanoai');
const jimeng = require('./jimeng');

const providers = new Map([
  [dashscope.id, dashscope],
  [nanoai.id, nanoai],
  [jimeng.id, jimeng],
]);

function getProvider(id) {
  return providers.get(String(id || 'dashscope')) || null;
}

module.exports = { getProvider };
