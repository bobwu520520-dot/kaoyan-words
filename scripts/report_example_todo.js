const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const words = JSON.parse(fs.readFileSync(path.join(root, 'data', 'words.json'), 'utf8')).words;
const missing = words
  .filter(w => w.active !== false && (!w.example_en || !w.example_zh))
  .map(w => ({ word: w.word, tier: w.tier || '', pos: w.pos || '', translation: w.translation || '' }));
const high = missing.filter(w => w.tier === '高频重点');
const extended = missing.filter(w => w.tier === '重点扩展');
fs.writeFileSync(path.join(root, 'data', 'example_todo_high_frequency.json'), JSON.stringify({
  note: '待补真实可核验例句；不将词典例句或自拟句标记为真题。',
  count: high.length,
  words: high,
}, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ highFrequency: high.length, extended: extended.length, total: missing.length }));
