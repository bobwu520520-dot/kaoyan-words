#!/usr/bin/env node
/* 词库完整性检查: 运行方式 node scripts/validate-words.js [data/words.json] */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = process.argv[2] || path.join(__dirname, '..', 'data', 'words.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const words = data.words || [];
const TIERS = ['核心高频', '高频重点', '重点扩展', '普通扩展'];
const FIELD_LIST = ['word', 'phonetic', 'pos', 'translation', 'example_en', 'example_zh', 'tier',
  'exam_meaning', 'secondary_meanings', 'collocation_hint', 'word_family', 'synonyms', 'antonyms',
  'confusable_words', 'word_forms', 'quality_score', 'source', 'data_version',
  // 既有旧字段(保留,不参与新规范)
  'tag', 'active', 'quality', 'true_priority', 'note', 'studyEligible', 'defs', 'frequency_hint',
  // 预留字段(暂为空,供未来真题数据)
  'exam_frequency', 'exam_years', 'exam_types', 'exam_contexts'];

const problems = { duplicates: [], emptyWord: [], badTier: [], badType: [],
  badPhonetic: [], exNoWord: [], illegalChars: [], extraSpace: [], dupCollocations: [], badScore: [] };

// 不规则屈折表(常用, 覆盖词库实际出现的形式)
const IRREG = {
  'abide': ['abides','abided','abiding','abode'],
  'admit': ['admits','admitted','admitting'],
  'amplify': ['amplifies','amplified','amplifying'],
  'ban': ['bans','banned','banning'],
  'bet': ['bets','bet','betted','betting'],
  'boot': ['boots','booted','booting'],
  'bring': ['brings','brought','bringing'],
  'bury': ['buries','buried','burying'],
  'category': ['categories'],
  'child': ['children'],
  'come': ['comes','came','coming'],
  'clarify': ['clarifies','clarified','clarifying'],
  'commit': ['commits','committed','committing'],
  'contemplate': ['contemplates','contemplated','contemplating'],
  'cry': ['cries','cried','crying'],
  'defer': ['defers','deferred','deferring'],
  'deny': ['denies','denied','denying'],
  'drag': ['drags','dragged','dragging'],
  'draw': ['draws','drew','drawn','drawing'],
  'drop': ['drops','dropped','dropping'],
  'employment': ['employments'],
  'enemy': ['enemies'],
  'enter': ['enters','entered','entering'],
  'facility': ['facilities'],
  'fair': ['fairer','fairest','fairly'],
  'find': ['finds','found','finding'],
  'flee': ['flees','fled','fleeing'],
  'give': ['gives','gave','given','giving'],
  'go': ['goes','went','gone','going'],
  'grab': ['grabs','grabbed','grabbing'],
  'grow': ['grows','grew','grown','growing'],
  'hide': ['hides','hid','hidden','hiding'],
  'hold': ['holds','held','holding'],
  'identify': ['identifies','identified','identifying'],
  'investigate': ['investigates','investigated','investigating'],
  'know': ['knows','knew','known','knowing'],
  'lay': ['lays','laid','laying'],
  'lead': ['leads','led','leading'],
  'leaf': ['leaves'],
  'long': ['longer','longest'],
  'lose': ['loses','lost','losing'],
  'marry': ['marries','married','marrying'],
  'memory': ['memories'],
  'negotiate': ['negotiates','negotiated','negotiating'],
  'nod': ['nods','nodded','nodding'],
  'occupy': ['occupies','occupied','occupying'],
  'occur': ['occurs','occurred','occurring'],
  'opportunity': ['opportunities'],
  'overcome': ['overcomes','overcame','overcoming'],
  'overlap': ['overlaps','overlapped','overlapping'],
  'prepare': ['prepares','prepared','preparing'],
  'program': ['programs','programmed','programming'],
  'qualify': ['qualifies','qualified','qualifying'],
  'rely': ['relies','relied','relying'],
  'reply': ['replies','replied','replying'],
  'satisfy': ['satisfies','satisfied','satisfying'],
  'shake': ['shakes','shook','shaken','shaking'],
  'shoot': ['shoots','shot','shooting'],
  'shrug': ['shrugs','shrugged','shrugging'],
  'sink': ['sinks','sank','sunk','sinking'],
  'slide': ['slides','slid','sliding'],
  'slip': ['slips','slipped','slipping'],
  'snap': ['snaps','snapped','snapping'],
  'spring': ['springs','sprang','sprung','springing'],
  'steal': ['steals','stole','stolen','stealing'],
  'stir': ['stirs','stirred','stirring'],
  'stop': ['stops','stopped','stopping'],
  'strip': ['strips','stripped','stripping'],
  'submit': ['submits','submitted','submitting'],
  'subsidy': ['subsidies'],
  'swear': ['swears','swore','sworn','swearing'],
  'sweep': ['sweeps','swept','sweeping'],
  'swell': ['swells','swelled','swollen','swelling'],
  'swing': ['swings','swung','swinging'],
  'take': ['takes','took','taken','taking'],
  'tap': ['taps','tapped','tapping'],
  'tear': ['tears','tore','torn','tearing'],
  'throw': ['throws','threw','thrown','throwing'],
  'transfer': ['transfers','transferred','transferring'],
  'try': ['tries','tried','trying'],
  'undergo': ['undergoes','underwent','undergone','undergoing'],
  'undertake': ['undertakes','undertook','undertaken','undertaking'],
  'wear': ['wears','wore','worn','wearing'],
  'win': ['wins','won','winning'],
  'withdraw': ['withdraws','withdrew','withdrawn','withdrawing'],
  'wrap': ['wraps','wrapped','wrapping'],
};
const IRREG_FORMS = {}; // 形式 -> 词根(反向索引)
for (const [base, forms] of Object.entries(IRREG)) for (const f of forms) IRREG_FORMS[f] = base;

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// 从单词推导可能的词根: 复数去尾、ed/ing 去尾、双写还原、比较级去尾
function possibleBases(word) {
  const b = new Set([word]);
  if (word.endsWith('ies')) b.add(word.slice(0, -3) + 'y');
  if (word.endsWith('es')) b.add(word.slice(0, -2));
  if (word.endsWith('s')) b.add(word.slice(0, -1));
  if (word.endsWith('ied')) b.add(word.slice(0, -3) + 'y');
  if (word.endsWith('ed') && word.length > 3) { b.add(word.slice(0, -2)); b.add(word.slice(0, -1)); }
  if (word.endsWith('ing') && word.length > 4) { b.add(word.slice(0, -3)); b.add(word.slice(0, -3) + 'e'); }
  if (word.endsWith('er')) b.add(word.slice(0, -2)); // 比较级 longer -> long
  if (word.endsWith('est')) b.add(word.slice(0, -3));
  for (const x of [...b]) { // 双写还原 dropped -> drop
    if (x.length > 3 && x[x.length - 1] === x[x.length - 2]) b.add(x.slice(0, -1));
  }
  return b;
}

// 例句是否包含目标词的屈折形式
function hasInflection(word, sentence) {
  const bases = possibleBases(word);
  const targets = new Set();
  for (const base of bases) {
    targets.add(base); targets.add(base + 's'); targets.add(base + 'es');
    targets.add(base + 'ed'); targets.add(base + 'd');
    targets.add(base + 'ing'); targets.add(base + 'ly');
    if (/[aeiou]/.test(base.slice(-2, -1)) && /[bcdfghjklmnpqrstvwxz]/.test(base.slice(-1)) && !/[aeiou]y$/.test(base) && base.length >= 3) {
      targets.add(base + base.slice(-1) + 'ed'); targets.add(base + base.slice(-1) + 'ing');
    }
    if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
      targets.add(base.slice(0, -1) + 'ies'); targets.add(base.slice(0, -1) + 'ied'); targets.add(base.slice(0, -1) + 'ier');
    }
    if (base.endsWith('e')) { targets.add(base.slice(0, -1) + 'ing'); targets.add(base.slice(0, -1) + 'ed'); }
    if (IRREG[base]) for (const f of IRREG[base]) targets.add(f); // 词根的不规则形式 draw -> drew
  }
  if (IRREG_FORMS[word]) { targets.add(IRREG_FORMS[word]); for (const f of IRREG[IRREG_FORMS[word]]) targets.add(f); } // 词条本身是屈折形式
  for (const t of targets) {
    if (new RegExp('\\b' + escRe(t) + '\\b', 'i').test(sentence)) return true;
  }
  return false;
}

const seen = new Map();
for (const w of words) {
  // 重复词
  if (seen.has(w.word)) problems.duplicates.push(w.word);
  seen.set(w.word, (seen.get(w.word) || 0) + 1);
  // 空词
  if (!w.word || !w.word.trim()) { problems.emptyWord.push(w.word); continue; }
  // tier 合法性
  if (!TIERS.includes(w.tier)) problems.badTier.push(w.word);
  // 字段类型
  for (const f of ['word', 'tier', 'translation']) {
    if (w[f] != null && typeof w[f] !== 'string') problems.badType.push(w.word + ':' + f);
  }
  for (const f of ['exam_frequency']) {
    if (w[f] != null && typeof w[f] !== 'number' && w[f] !== null) problems.badType.push(w.word + ':' + f);
  }
  for (const f of ['exam_years', 'exam_types', 'exam_contexts', 'confusable_words']) {
    if (w[f] != null && !Array.isArray(w[f])) problems.badType.push(w.word + ':' + f);
  }
  // synonyms/antonyms/word_forms 允许字符串或数组(展示层用字符串)
  for (const f of ['synonyms', 'antonyms', 'word_forms']) {
    if (w[f] != null && typeof w[f] !== 'string' && !Array.isArray(w[f])) problems.badType.push(w.word + ':' + f);
  }
  // 音标格式(应含 / 或 [] 或 IPA 字符; 长度>=3; 无中文)
  if (w.phonetic && (w.phonetic.length < 3 || /[\u4e00-\u9fff]/.test(w.phonetic) || /\s\s/.test(w.phonetic))) {
    problems.badPhonetic.push(w.word + ':' + w.phonetic);
  }
  // 例句必须包含目标词(允许常见屈折变形)
  if (w.example_en && !hasInflection(w.word, w.example_en)) {
    problems.exNoWord.push(w.word + ':' + w.example_en.slice(0, 50));
  }
  // 非法字符(释义/例句中不应出现控制字符)
  for (const f of ['translation', 'example_en', 'example_zh']) {
    if (w[f] && /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(w[f])) problems.illegalChars.push(w.word + ':' + f);
  }
  // 多余空格
  for (const f of ['translation', 'example_en', 'example_zh', 'collocation_hint']) {
    if (w[f] && (/\s{2,}/.test(w[f]) || /^\s|\s$/.test(w[f]))) problems.extraSpace.push(w.word + ':' + f);
  }
  // 搭配重复
  if (w.collocation_hint) {
    const parts = w.collocation_hint.split(/[·;、]/).map(s => s.trim()).filter(Boolean);
    if (new Set(parts).size !== parts.length) problems.dupCollocations.push(w.word);
  }
  // quality_score 合法性
  if (w.quality_score && !['A', 'B', 'C', 'D'].includes(w.quality_score)) problems.badScore.push(w.word + ':' + w.quality_score);
}
// 字段名统一性: 找出非规范字段
const extraFields = new Set();
for (const w of words) for (const k of Object.keys(w)) if (!FIELD_LIST.includes(k)) extraFields.add(k);

console.log('===== 词库完整性检查 =====');
console.log('词库版本:', data.data_version || data.DATA_VERSION || '(无)');
console.log('总词数:', words.length);
console.log('---- 问题统计 ----');
console.log('重复词:', problems.duplicates.length, problems.duplicates.slice(0, 10));
console.log('空词条:', problems.emptyWord.length);
console.log('tier 非法:', problems.badTier.length, problems.badTier.slice(0, 10));
console.log('字段类型错误:', problems.badType.length, problems.badType.slice(0, 10));
console.log('音标格式异常:', problems.badPhonetic.length, problems.badPhonetic.slice(0, 10));
console.log('例句不含目标词:', problems.exNoWord.length);
for (const p of problems.exNoWord.slice(0, 15)) console.log('   ', p);
console.log('控制字符:', problems.illegalChars.length);
console.log('多余空格:', problems.extraSpace.length, problems.extraSpace.slice(0, 10));
console.log('搭配重复:', problems.dupCollocations.length, problems.dupCollocations.slice(0, 10));
console.log('quality_score 非法:', problems.badScore.length, problems.badScore.slice(0, 10));
console.log('非规范字段名:', [...extraFields]);
console.log('---- 缺失字段统计 ----');
const fields = ['phonetic', 'pos', 'translation', 'example_en', 'example_zh', 'exam_meaning', 'secondary_meanings', 'collocation_hint', 'word_family', 'synonyms', 'antonyms', 'quality_score'];
for (const f of fields) {
  const n = words.filter(w => w[f]).length;
  console.log(`${f}: ${n}/${words.length} (${(n / words.length * 100).toFixed(1)}%)`);
}
const total = problems.duplicates.length + problems.emptyWord.length + problems.badTier.length +
  problems.badType.length + problems.badPhonetic.length + problems.exNoWord.length +
  problems.illegalChars.length + problems.extraSpace.length + problems.badScore.length;
console.log('---- 结论 ----');
console.log(total === 0 ? '✓ 未发现异常' : `✗ 发现 ${total} 处异常, 需要处理`);
