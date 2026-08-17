#!/usr/bin/env node
/* 词库统计报告: 运行方式 node scripts/word-stats.js [data/words.json] */
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = process.argv[2] || path.join(__dirname, '..', 'data', 'words.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const words = data.words || [];
const TIERS = ['核心高频', '高频重点', '重点扩展', '普通扩展'];
const FIELDS = ['phonetic', 'pos', 'translation', 'example_en', 'example_zh', 'exam_meaning',
  'secondary_meanings', 'collocation_hint', 'word_family', 'synonyms', 'antonyms',
  'confusable_words', 'word_forms', 'quality_score'];

const pct = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '-';
console.log('===== 词库统计报告 =====');
console.log('词库版本:', data.data_version || '(无)');
console.log('总词数:', words.length, '| 重复词:', words.length - new Set(words.map(w => w.word)).size);

console.log('\n---- 各 tier 数量 ----');
for (const t of TIERS) {
  const n = words.filter(w => w.tier === t).length;
  console.log(`${t}: ${n}`);
}

console.log('\n---- 全库字段覆盖率 ----');
for (const f of FIELDS) {
  const n = words.filter(w => w[f]).length;
  console.log(`${f}: ${n}/${words.length} (${pct(n, words.length)})`);
}

console.log('\n---- 分层覆盖率 ----');
const header = ['tier', ...FIELDS];
console.log(header.join('\t'));
for (const t of TIERS) {
  const pool = words.filter(w => w.tier === t);
  const row = [t];
  for (const f of FIELDS) {
    const n = pool.filter(w => w[f]).length;
    row.push(`${n}/${pool.length}(${pct(n, pool.length)})`);
  }
  console.log(row.join('\t'));
}

console.log('\n---- quality_score 分布 ----');
const qc = {};
for (const w of words) qc[w.quality_score || '(空)'] = (qc[w.quality_score || '(空)'] || 0) + 1;
console.log(JSON.stringify(qc, null, 0));
